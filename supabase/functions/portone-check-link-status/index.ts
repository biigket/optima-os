import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const PORTONE_KEY = Deno.env.get('PORTONE_KEY');
    const PORTONE_SECRET = Deno.env.get('PORTONE_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!PORTONE_KEY || !PORTONE_SECRET) {
      throw new Error('PortOne credentials not configured');
    }

    const { quotation_id } = await req.json();
    if (!quotation_id) throw new Error('quotation_id is required');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all payment links for this quotation
    const { data: links, error: linksErr } = await supabase
      .from('payment_links')
      .select('*')
      .eq('quotation_id', quotation_id)
      .order('created_at', { ascending: false });

    if (linksErr) throw linksErr;
    if (!links || links.length === 0) {
      return new Response(JSON.stringify({ success: true, links: [], message: 'No payment links found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth token
    const tokenRes = await fetch('https://api.portone.cloud/api/merchant/auth-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ portone_key: PORTONE_KEY, portone_secret: PORTONE_SECRET }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(`PortOne auth failed: ${JSON.stringify(tokenData)}`);
    const bearerToken = tokenData?.content?.token || tokenData?.data?.token || tokenData?.token;
    if (!bearerToken) throw new Error('No token in auth response');

    // Check status for each link
    const updatedLinks: any[] = [];
    for (const link of links) {
      if (!link.payment_link_ref) {
        updatedLinks.push(link);
        continue;
      }

      try {
        const statusRes = await fetch(`https://api.portone.cloud/api/paymentLink/${link.payment_link_ref}/cancelled`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'X-Portone-Client-Key': PORTONE_KEY,
            'Accept': 'application/json',
          },
        });

        // Try the general status endpoint
        const linkDetailRes = await fetch(`https://api.portone.cloud/api/paymentLink/${link.payment_link_ref}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'X-Portone-Client-Key': PORTONE_KEY,
            'Accept': 'application/json',
          },
        });
        
        if (linkDetailRes.ok) {
          const detail = await linkDetailRes.json();
          const linkData = detail?.data || detail?.content || detail;
          const linkStatus = linkData?.link_status || linkData?.status || link.status;
          
          // Map PortOne status to our status
          let mappedStatus = 'ACTIVE';
          const lower = String(linkStatus).toLowerCase();
          if (lower === 'completed' || lower === 'paid' || lower === 'success') {
            mappedStatus = 'COMPLETED';
          } else if (lower === 'cancelled' || lower === 'canceled') {
            mappedStatus = 'CANCELLED';
          } else if (lower === 'expired') {
            mappedStatus = 'EXPIRED';
          } else if (lower === 'active' || lower === 'created') {
            mappedStatus = 'ACTIVE';
          }

          // Update in DB if status changed
          if (mappedStatus !== link.status) {
            await supabase
              .from('payment_links')
              .update({ status: mappedStatus })
              .eq('id', link.id);
          }

          updatedLinks.push({ ...link, status: mappedStatus });
        } else {
          console.log(`Failed to get status for ${link.payment_link_ref}: ${linkDetailRes.status}`);
          updatedLinks.push(link);
        }
      } catch (e) {
        console.error(`Error checking link ${link.payment_link_ref}:`, e);
        updatedLinks.push(link);
      }
    }

    return new Response(JSON.stringify({ success: true, links: updatedLinks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error checking link status:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

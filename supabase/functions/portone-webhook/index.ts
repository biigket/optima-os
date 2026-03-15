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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const quotationId = url.searchParams.get('quotation_id');

    // Handle redirect callback (GET from PortOne redirect)
    if (req.method === 'GET' && quotationId) {
      if (status === 'success') {
        // Update payment status
        await supabase
          .from('quotations')
          .update({ payment_status: 'PAID' })
          .eq('id', quotationId);

        // Mark all installments as verified
        await supabase
          .from('payment_installments')
          .update({
            slip_status: 'VERIFIED',
            paid_date: new Date().toISOString().split('T')[0],
            payment_channel: 'CREDIT_CARD_PORTONE',
            verified_at: new Date().toISOString(),
            verified_by: 'PortOne',
          })
          .eq('quotation_id', quotationId);
      }

      // Redirect to payment result page
      const redirectUrl = `https://optima-os.lovable.app/payment-result?status=${status}&quotation_id=${quotationId}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': redirectUrl },
      });
    }

    // Handle POST webhook from PortOne
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('PortOne webhook payload:', JSON.stringify(body));

      const orderRef = body?.merchant_order_id || body?.data?.merchant_order_id;
      const paymentStatus = body?.status || body?.data?.status;

      if (orderRef) {
        // Find quotation by portone_order_id
        const { data: qt } = await supabase
          .from('quotations')
          .select('id')
          .eq('portone_order_id', orderRef)
          .single();

        if (qt && (paymentStatus === 'SUCCESS' || paymentStatus === 'COMPLETED' || paymentStatus === 'Successful')) {
          await supabase
            .from('quotations')
            .update({ payment_status: 'PAID' })
            .eq('id', qt.id);

          await supabase
            .from('payment_installments')
            .update({
              slip_status: 'VERIFIED',
              paid_date: new Date().toISOString().split('T')[0],
              payment_channel: 'CREDIT_CARD_PORTONE',
              verified_at: new Date().toISOString(),
              verified_by: 'PortOne',
            })
            .eq('quotation_id', qt.id);

          // Log payment in activity / timeline via notes or future activity log
          console.log(`Payment completed for quotation ${qt.id} via PortOne`);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

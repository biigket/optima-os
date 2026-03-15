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

    const { quotation_id, installment_months, custom_amount, notify_by_email, notify_by_phone, pmt_channel, pmt_method, sms_phone, remark } = await req.json();
    if (!quotation_id) throw new Error('quotation_id is required');

    // Helper: normalize Thai phone to E.164 format (+66...)
    function normalizeThaiPhone(phone: string | null | undefined): string {
      if (!phone) return '';
      // Remove all non-digit characters
      let digits = phone.replace(/\D/g, '');
      // If starts with 0, replace with 66
      if (digits.startsWith('0')) {
        digits = '66' + digits.substring(1);
      }
      // If doesn't start with 66, prepend it
      if (!digits.startsWith('66')) {
        digits = '66' + digits;
      }
      return '+' + digits;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch quotation + account
    const { data: qt, error: qtErr } = await supabase
      .from('quotations')
      .select('id, qt_number, price, product, account_id, payment_condition')
      .eq('id', quotation_id)
      .single();
    if (qtErr || !qt) throw new Error('Quotation not found');

    const { data: account } = await supabase
      .from('accounts')
      .select('clinic_name, email, phone')
      .eq('id', qt.account_id)
      .single();

    // Step 1: Get auth token
    const tokenRes = await fetch('https://api.portone.cloud/api/merchant/auth-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ portone_key: PORTONE_KEY, portone_secret: PORTONE_SECRET }),
    });
    const tokenText = await tokenRes.text();
    console.log('PortOne auth status:', tokenRes.status);
    let tokenData: any;
    try { tokenData = JSON.parse(tokenText); } catch { throw new Error(`PortOne auth non-JSON: ${tokenText}`); }
    if (!tokenRes.ok) throw new Error(`PortOne auth failed [${tokenRes.status}]: ${tokenText}`);
    const bearerToken = tokenData?.content?.token || tokenData?.data?.token || tokenData?.token;
    if (!bearerToken) throw new Error(`No token in response: ${tokenText}`);

    // Step 2: Build URLs and generate signature
    const merchantOrderId = `${qt.qt_number || 'QT'}-${Date.now()}`;
    const amount = custom_amount && Number(custom_amount) > 0 ? Number(custom_amount) : (qt.price || 0);
    
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const successUrl = `${SUPABASE_URL}/functions/v1/portone-webhook?status=success&quotation_id=${quotation_id}`;
    const failureUrl = `${SUPABASE_URL}/functions/v1/portone-webhook?status=failure&quotation_id=${quotation_id}`;
    const pendingUrl = `${SUPABASE_URL}/functions/v1/portone-webhook?status=pending&quotation_id=${quotation_id}`;

    // Generate signature hash (HMAC-SHA256) with all required params
    const sigParams: Record<string, string> = {
      amount: String(amount),
      client_key: PORTONE_KEY,
      currency: 'THB',
      failure_url: failureUrl,
      merchant_order_id: merchantOrderId,
      success_url: successUrl,
    };
    // url.Values.Encode() sorts alphabetically and uses QueryEscape
    const sortedKeys = Object.keys(sigParams).sort();
    const sigMessage = sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(sigParams[k])}`).join('&');
    const encoder = new TextEncoder();
    const keyData = encoder.encode(PORTONE_SECRET);
    const msgData = encoder.encode(sigMessage);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const signatureHash = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));
    console.log('Sig message:', sigMessage);
    const normalizedPhone = normalizeThaiPhone(sms_phone || account?.phone);
    console.log('Phone raw:', sms_phone || account?.phone, '-> normalized:', normalizedPhone);

    let description = `ชำระเงินสำหรับ ${qt.product || 'สินค้า'} - ${qt.qt_number || ''}`;
    if (installment_months && installment_months > 1) {
      description += ` (ผ่อน ${installment_months} เดือน)`;
    }

    const linkBody = {
      portone_key: PORTONE_KEY,
      merchant_details: {
        name: "Optima Medical",
        logo: "",
        back_url: "",
        promo_code: "NA",
        promo_discount: 0,
        shipping_charges: 0,
      },
      source: "default",
      description,
      signature_hash: signatureHash,
      amount,
      currency: "THB",
      country_code: "TH",
      merchant_order_id: merchantOrderId,
      show_shipping_details: false,
      billing_details: {
        billing_name: account?.clinic_name || "Customer",
        billing_email: account?.email || "",
        billing_phone: normalizeThaiPhone(sms_phone || account?.phone),
        billing_address: {
          city: "",
          country_code: "TH",
          locale: "TH",
          line_1: "",
          line_2: "",
          postal_code: "",
          state: "",
        },
      },
      is_checkout_embed: false,
      success_url: successUrl,
      failure_url: failureUrl,
      pending_url: pendingUrl,
      expiry_date: expiry.toISOString(),
      customer_details: {
        name: account?.clinic_name || "Customer",
        email_address: account?.email || "",
        phone_number: normalizeThaiPhone(sms_phone || account?.phone),
      },
      notify_by_email: notify_by_email !== undefined ? notify_by_email : !!(account?.email),
      notify_by_phone: notify_by_phone !== undefined ? notify_by_phone : !!(account?.phone),
      notes: [
        { key: "quotation_id", value: quotation_id },
        { key: "qt_number", value: qt.qt_number || "" },
      ],
      send_immediately: false,
      chosen_payment_methods: [
        { payment_channel: pmt_channel || "GBPRIMEPAY", payment_method: pmt_method || "GBPRIMEPAY_CREDIT_CARD" },
      ],
      environment: "live",
    };

    console.log('Creating payment link...');
    const linkRes = await fetch('https://api.portone.cloud/api/paymentLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`,
        'X-Portone-Client-Key': PORTONE_KEY,
      },
      body: JSON.stringify(linkBody),
    });
    const linkText = await linkRes.text();
    console.log('PortOne link response:', linkRes.status, linkText);
    let linkData: any;
    try { linkData = JSON.parse(linkText); } catch { throw new Error(`PortOne link non-JSON: ${linkText}`); }
    if (!linkRes.ok) throw new Error(`PortOne create link failed [${linkRes.status}]: ${linkText}`);

    const paymentLinkUrl = linkData?.data?.payment_link || linkData?.content?.payment_link || linkData?.payment_link || '';
    const paymentLinkRef = linkData?.data?.payment_link_ref || linkData?.content?.payment_link_ref || linkData?.payment_link_ref || '';

    // Save to quotation
    await supabase
      .from('quotations')
      .update({
        payment_link_url: paymentLinkUrl,
        payment_link_ref: paymentLinkRef,
        portone_order_id: merchantOrderId,
      })
      .eq('id', quotation_id);

    // Save to payment_links history
    await supabase
      .from('payment_links')
      .insert({
        quotation_id,
        amount,
        installment_months: installment_months || 0,
        payment_link_url: paymentLinkUrl,
        payment_link_ref: paymentLinkRef,
        portone_order_id: merchantOrderId,
        status: 'ACTIVE',
      });

    return new Response(JSON.stringify({
      success: true,
      payment_link_url: paymentLinkUrl,
      payment_link_ref: paymentLinkRef,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error creating payment link:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  // Remove BOM
  if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].slice(1);
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i+1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { table, baseUrl } = await req.json();
  const results: Record<string, any> = {};

  try {
    if (table === 'all' || table === 'products') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-products.csv`)).text();
      const rows = parseCSV(csv).map(r => ({
        id: r.product_id, product_name: r.product_name, product_code: r.product_code || null,
        category: r.category || 'DEVICE', description: r.description || null,
        base_price: r.base_price ? parseFloat(r.base_price) : null,
      }));
      const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
      results.products = { count: rows.length, error: error?.message };
    }

    if (table === 'all' || table === 'accounts') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-accounts.csv`)).text();
      const rows = parseCSV(csv).map(r => ({
        id: r.account_id, clinic_name: r.clinic_name, company_name: r.company_name || null,
        address: r.address || null, tax_id: r.tax_id || null, entity_type: r.entity_type || null,
        branch_type: r.branch_type || null, customer_status: r.customer_status || 'NEW_LEAD',
        assigned_sale: r.assigned_sale || null, lead_source: r.lead_source || null,
        current_devices: r.current_devices || null, single_or_chain: r.single_or_chain || null,
        phone: r.phone || null, email: r.email || null, notes: r.notes || null,
      }));
      // Insert in batches of 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('accounts').upsert(batch, { onConflict: 'id' });
        if (error) { results.accounts = { count: i, error: error.message }; break; }
      }
      if (!results.accounts) results.accounts = { count: rows.length, error: null };
    }

    if (table === 'all' || table === 'contacts') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-contacts.csv`)).text();
      const rows = parseCSV(csv).map(r => ({
        account_id: r.account_id, name: r.name, role: r.role || null,
        phone: r.phone || null, email: r.email || null, line_id: r.line_id || null,
        is_decision_maker: r.is_decision_maker === 'true',
      }));
      const { error } = await supabase.from('contacts').insert(rows);
      results.contacts = { count: rows.length, error: error?.message };
    }

    if (table === 'all' || table === 'qc_stock_items') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-qc_stock_items.csv`)).text();
      const rows = parseCSV(csv).map(r => ({
        product_type: r.product_type, serial_number: r.serial_number || null,
        status: r.status || 'พร้อมขาย', clinic: r.clinic || null,
        hfl1: r.hfl1 || null, hfl2: r.hfl2 || null,
        hsd1: r.hsd1 || null, hsd2: r.hsd2 || null,
        hrm: r.hrm || null, hrm_sell_or_keep: r.hrm_sell_or_keep || null,
        ups_stabilizer: r.ups_stabilizer || null,
        received_date: r.received_date || null,
        storage_location: r.storage_location || null,
        inspection_doc: r.inspection_doc || null,
        fail_reason: r.fail_reason || null, notes: r.notes || null,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('qc_stock_items').insert(batch);
        if (error) { results.qc_stock_items = { count: i, error: error.message }; break; }
      }
      if (!results.qc_stock_items) results.qc_stock_items = { count: rows.length, error: null };
    }

    if (table === 'all' || table === 'installations') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-installations.csv`)).text();
      const rows = parseCSV(csv).map(r => ({
        id: r.id || undefined,
        account_id: r.account_id || null, product_id: r.product_id || null,
        serial_number: r.serial_number || null, province: r.province || null,
        region: r.region || null, district: r.district || null,
        status: r.status || 'ACTIVE',
        install_date: r.install_date || null,
        warranty_days: r.warranty_days ? parseInt(r.warranty_days) : null,
        warranty_expiry: r.warranty_expiry || null,
        has_rm_handpiece: r.has_rm_handpiece === 'true',
        cartridges_installed: r.cartridges_installed || null,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('installations').insert(batch);
        if (error) { results.installations = { count: i, error: error.message }; break; }
      }
      if (!results.installations) results.installations = { count: rows.length, error: null };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message, results }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

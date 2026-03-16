import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseCSV(text: string): Record<string, string>[] {
  // Remove BOM
  let clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim(); });
    return obj;
  }).filter(obj => {
    // Filter out rows where all values are empty
    return Object.values(obj).some(v => v.length > 0);
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

function nullIfEmpty(v: string | undefined): string | null {
  return v && v.trim().length > 0 ? v.trim() : null;
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
    // 1. Products
    if (table === 'all' || table === 'products') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-products.csv`)).text();
      const rows = parseCSV(csv).filter(r => r.product_id).map(r => ({
        id: r.product_id, product_name: r.product_name, product_code: nullIfEmpty(r.product_code),
        category: r.category || 'DEVICE', description: nullIfEmpty(r.description),
        base_price: r.base_price ? parseFloat(r.base_price) : null,
      }));
      const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
      results.products = { count: rows.length, error: error?.message || null };
    }

    // 2. Accounts
    if (table === 'all' || table === 'accounts') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-accounts.csv`)).text();
      const rows = parseCSV(csv).filter(r => r.account_id && r.clinic_name).map(r => ({
        id: r.account_id, clinic_name: r.clinic_name, company_name: nullIfEmpty(r.company_name),
        address: nullIfEmpty(r.address), tax_id: nullIfEmpty(r.tax_id), 
        entity_type: nullIfEmpty(r.entity_type), branch_type: nullIfEmpty(r.branch_type), 
        customer_status: r.customer_status || 'NEW_LEAD',
        assigned_sale: nullIfEmpty(r.assigned_sale), lead_source: nullIfEmpty(r.lead_source),
        current_devices: nullIfEmpty(r.current_devices), single_or_chain: nullIfEmpty(r.single_or_chain),
        phone: nullIfEmpty(r.phone), email: nullIfEmpty(r.email), notes: nullIfEmpty(r.notes),
      }));
      let totalDone = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('accounts').upsert(batch, { onConflict: 'id' });
        if (error) { results.accounts = { count: totalDone, error: error.message }; break; }
        totalDone += batch.length;
      }
      if (!results.accounts) results.accounts = { count: totalDone, error: null };
    }

    // 3. Contacts
    if (table === 'all' || table === 'contacts') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-contacts.csv`)).text();
      const rows = parseCSV(csv).filter(r => r.account_id && r.name).map(r => ({
        account_id: r.account_id, name: r.name, role: nullIfEmpty(r.role),
        phone: nullIfEmpty(r.phone), email: nullIfEmpty(r.email), 
        line_id: nullIfEmpty(r.line_id),
        is_decision_maker: r.is_decision_maker === 'true',
      }));
      const { error } = await supabase.from('contacts').insert(rows);
      results.contacts = { count: rows.length, error: error?.message || null };
    }

    // 4. QC Stock Items
    if (table === 'all' || table === 'qc_stock_items') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-qc_stock_items.csv`)).text();
      const rows = parseCSV(csv).filter(r => r.product_type).map(r => ({
        product_type: r.product_type, serial_number: nullIfEmpty(r.serial_number),
        status: r.status || 'พร้อมขาย', clinic: nullIfEmpty(r.clinic),
        hfl1: nullIfEmpty(r.hfl1), hfl2: nullIfEmpty(r.hfl2),
        hsd1: nullIfEmpty(r.hsd1), hsd2: nullIfEmpty(r.hsd2),
        hrm: nullIfEmpty(r.hrm), hrm_sell_or_keep: nullIfEmpty(r.hrm_sell_or_keep),
        ups_stabilizer: nullIfEmpty(r.ups_stabilizer),
        received_date: nullIfEmpty(r.received_date),
        storage_location: nullIfEmpty(r.storage_location),
        inspection_doc: nullIfEmpty(r.inspection_doc),
        fail_reason: nullIfEmpty(r.fail_reason), notes: nullIfEmpty(r.notes),
      }));
      let totalDone = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('qc_stock_items').insert(batch);
        if (error) { results.qc_stock_items = { count: totalDone, error: error.message, failedBatch: i }; break; }
        totalDone += batch.length;
      }
      if (!results.qc_stock_items) results.qc_stock_items = { count: totalDone, error: null };
    }

    // 5. Installations
    if (table === 'all' || table === 'installations') {
      const csv = await (await fetch(`${baseUrl}/import-data/import-installations.csv`)).text();
      const rows = parseCSV(csv).filter(r => r.account_id && r.product_id).map(r => {
        const wd = r.warranty_days ? parseInt(r.warranty_days) : null;
        // Fix bad dates like 1901-12-30
        let installDate = nullIfEmpty(r.install_date);
        if (installDate && installDate < '2000') installDate = null;
        let warrantyExpiry = nullIfEmpty(r.warranty_expiry);
        if (warrantyExpiry && warrantyExpiry < '2000') warrantyExpiry = null;
        return {
          account_id: r.account_id, product_id: r.product_id,
          serial_number: nullIfEmpty(r.serial_number), province: nullIfEmpty(r.province),
          region: nullIfEmpty(r.region), district: nullIfEmpty(r.district),
          status: r.status || 'ACTIVE',
          install_date: installDate,
          warranty_days: wd,
          warranty_expiry: warrantyExpiry,
          has_rm_handpiece: r.has_rm_handpiece === 'true',
          cartridges_installed: nullIfEmpty(r.cartridges_installed),
        };
      });
      let totalDone = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase.from('installations').insert(batch);
        if (error) { results.installations = { count: totalDone, error: error.message, failedBatch: i }; break; }
        totalDone += batch.length;
      }
      if (!results.installations) results.installations = { count: totalDone, error: null };
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

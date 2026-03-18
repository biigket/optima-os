import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
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

function parseCSVWithMultiline(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/^\uFEFF/, '').split('\n');
  let currentLine = '';
  let inQuotes = false;

  for (const line of lines) {
    if (!inQuotes) {
      currentLine = line.replace(/\r$/, '');
    } else {
      currentLine += '\n' + line.replace(/\r$/, '');
    }

    // Count unescaped quotes
    let quoteCount = 0;
    for (let i = 0; i < currentLine.length; i++) {
      if (currentLine[i] === '"') {
        if (currentLine[i + 1] === '"') { i++; }
        else { quoteCount++; }
      }
    }
    inQuotes = quoteCount % 2 !== 0;

    if (!inQuotes) {
      if (currentLine.trim().length > 0) {
        rows.push(parseCSVLine(currentLine));
      }
      currentLine = '';
    }
  }
  return rows;
}

function parseDateDMY(s: string): string | null {
  if (!s || !s.trim()) return null;
  const clean = s.trim();
  // DD/MM/YYYY
  const m = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    return `${m[3]}-${month}-${day}`;
  }
  return null;
}

function normalizeStatus(raw: string): string {
  const s = raw.trim();
  if (s === 'พร้อมขาย') return 'พร้อมขาย';
  if (s === 'ขายแล้ว') return 'ติดตั้งแล้ว';
  if (s === 'ติดจอง') return 'ติดจอง';
  if (s === 'ไม่ผ่าน QC') return 'รอซ่อม/รอ QC';
  if (s === 'DEMO' || s === 'Support KOL') return 'DEMO/ยืม';
  if (s === 'รอเคลม ตปท.') return 'รอเคลม ตปท.';
  return 'พร้อมขาย';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { csvUrl } = await req.json();
    const resp = await fetch(csvUrl);
    const csvText = await resp.text();

    const allRows = parseCSVWithMultiline(csvText);
    if (allRows.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'No data rows' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Header indices (Thai headers)
    // 0: Cartridge S/N, 1: STATUS, 2: Cartridge, 3: สาเหตุไม่ผ่าน QC,
    // 4: วันที่รับเข้า Stock x, 5: วันที่รับเข้า Stock, 6: Clinic, 7: Clinic x,
    // 8: เก็บที่, 9: Note, 10: Sale ที่เบิก, 11: เบิกเพื่อ, 12: วันที่เบิก
    const dataRows = allRows.slice(1);

    // Deduplicate by serial number - keep first occurrence
    const seen = new Set<string>();
    const records: Record<string, any>[] = [];

    for (const cols of dataRows) {
      const sn = (cols[0] || '').trim();
      if (!sn || seen.has(sn)) continue;
      seen.add(sn);

      const status = normalizeStatus(cols[1] || '');
      const cartridgeType = (cols[2] || '').trim() || null;
      const failReason = (cols[3] || '').trim().replace(/\n/g, ' ').trim() || null;
      const receivedDate = parseDateDMY(cols[4] || '') || parseDateDMY(cols[5] || '');
      const clinic = (cols[6] || '').trim().replace(/\n/g, ' ').trim() || (cols[7] || '').trim().replace(/\n/g, ' ').trim() || null;
      const storageLocation = (cols[8] || '').trim() || null;
      const notes = (cols[9] || '').trim() || null;

      records.push({
        product_type: 'CARTRIDGE',
        serial_number: sn,
        cartridge_type: cartridgeType,
        status,
        fail_reason: failReason || null,
        received_date: receivedDate,
        clinic: clinic,
        storage_location: storageLocation,
        notes: notes,
      });
    }

    // Delete existing CARTRIDGE items first
    await supabase.from('qc_stock_items').delete().eq('product_type', 'CARTRIDGE');

    // Insert in batches of 50
    let totalDone = 0;
    for (let i = 0; i < records.length; i += 50) {
      const batch = records.slice(i, i + 50);
      const { error } = await supabase.from('qc_stock_items').insert(batch);
      if (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          inserted: totalDone,
          total: records.length,
          failedBatch: i,
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      totalDone += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: totalDone,
      total: records.length,
      deduplicated: dataRows.length - records.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

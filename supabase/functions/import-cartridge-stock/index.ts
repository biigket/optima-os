import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Full CSV parser that handles multiline quoted fields correctly.
 * Returns array of string arrays (rows x columns).
 */
function parseFullCSV(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < clean.length && clean[i + 1] === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\r') {
        // skip carriage return
      } else if (ch === '\n') {
        currentRow.push(currentField);
        currentField = '';
        // Only add row if it has some content
        if (currentRow.some(f => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += ch;
      }
    }
  }
  
  // Last field/row
  currentRow.push(currentField);
  if (currentRow.some(f => f.trim().length > 0)) {
    rows.push(currentRow);
  }
  
  return rows;
}

function parseDateDMY(s: string): string | null {
  if (!s || !s.trim()) return null;
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
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

function cleanField(s: string | undefined): string | null {
  if (!s) return null;
  const v = s.replace(/\n/g, ' ').replace(/\r/g, '').trim();
  return v.length > 0 ? v : null;
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

    const allRows = parseFullCSV(csvText);
    console.log(`Parsed ${allRows.length} rows (incl header)`);
    if (allRows.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'No data rows', rowCount: allRows.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip header row (index 0)
    // Columns: 0=S/N, 1=STATUS, 2=Cartridge, 3=สาเหตุ, 4=วันที่ x, 5=วันที่, 6=Clinic, 7=Clinic x, 8=เก็บที่, 9=Note
    const dataRows = allRows.slice(1);

    // Deduplicate by serial number - keep first occurrence
    const seen = new Set<string>();
    const records: Record<string, any>[] = [];

    for (const cols of dataRows) {
      const sn = (cols[0] || '').trim();
      if (!sn || seen.has(sn)) continue;
      seen.add(sn);

      const status = normalizeStatus(cols[1] || '');
      const cartridgeType = cleanField(cols[2]);
      const failReason = cleanField(cols[3]);
      const receivedDate = parseDateDMY(cols[4] || '') || parseDateDMY(cols[5] || '');
      const clinic = cleanField(cols[6]) || cleanField(cols[7]);
      const storageLocation = cleanField(cols[8]);
      const notes = cleanField(cols[9]);

      records.push({
        product_type: 'CARTRIDGE',
        serial_number: sn,
        cartridge_type: cartridgeType,
        status,
        fail_reason: failReason,
        received_date: receivedDate,
        clinic,
        storage_location: storageLocation,
        notes,
      });
    }

    console.log(`Unique records to insert: ${records.length}`);

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
          sampleRecord: batch[0],
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

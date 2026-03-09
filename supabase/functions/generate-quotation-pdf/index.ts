import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SELLER = {
  company: "บริษัท ออปติม่าแอสเทติค จำกัด",
  address:
    "65 ถนน วิชิตสงคราม ตำบลตลาดเหนือ อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000",
  taxId: "0835563001787",
  phone: "0828120999",
  email: "info@optimaaesthetic.co.th",
  website: "www.optimaaesthetic.com",
  logo: "https://szrjikvwdygyyxfztfvn.supabase.co/storage/v1/object/public/company-assets/optima-logo.png",
};

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function generateHTML(qt: any, account: any, contacts: any[]): string {
  // Parse products from the product string (format: "Name x1, Name x2")
  const productLines: { name: string; qty: number; price: number }[] = [];
  // We'll use price as grand total for now since we store aggregated

  const expiryDate = qt.qt_date ? addDays(qt.qt_date, 30) : null;
  const price = qt.price || 0;

  const paymentLabels: Record<string, string> = {
    CASH: "เงินสด",
    INSTALLMENT: "ผ่อนชำระ",
    LEASING: "ลีสซิ่ง",
  };

  const contactName =
    contacts.length > 0 ? contacts[0].name : "-";

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบเสนอราคา ${qt.qt_number || ""}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Sarabun', sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #f5f5f5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: white;
    padding: 20mm 18mm;
    position: relative;
  }
  
  @media print {
    body { background: white; }
    .page { margin: 0; padding: 15mm; box-shadow: none; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
  
  @media screen {
    .page { box-shadow: 0 2px 20px rgba(0,0,0,0.1); margin-top: 20px; margin-bottom: 20px; }
  }

   /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1e3a5f; }
  .header-left { display: flex; align-items: flex-start; gap: 14px; }
  .header-logo { width: 70px; height: auto; }
  .seller-info h1 { font-size: 18px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; }
  .seller-info p { font-size: 11px; color: #555; line-height: 1.6; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 22px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
  .doc-title .subtitle { font-size: 12px; color: #888; }

  /* Info Grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .info-box { border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 16px; }
  .info-box .label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #1e3a5f; letter-spacing: 0.5px; margin-bottom: 8px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .info-row .key { color: #777; font-size: 12px; }
  .info-row .val { font-weight: 500; font-size: 12px; }

  /* Product Table */
  .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .product-table thead { background: #1e3a5f; color: white; }
  .product-table th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
  .product-table th:nth-child(2), .product-table th:nth-child(3), .product-table th:nth-child(4) { text-align: right; }
  .product-table td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
  .product-table td:nth-child(2), .product-table td:nth-child(3), .product-table td:nth-child(4) { text-align: right; }
  .product-table tbody tr:hover { background: #f8f9fa; }

  /* Summary */
  .summary-section { display: flex; justify-content: flex-end; margin-bottom: 24px; }
  .summary-box { width: 280px; }
  .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
  .summary-row.total { border-top: 2px solid #1e3a5f; padding-top: 10px; margin-top: 4px; font-size: 15px; font-weight: 700; color: #1e3a5f; }

  /* Terms */
  .terms { border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px; }
  .terms .label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #1e3a5f; letter-spacing: 0.5px; margin-bottom: 8px; }
  .terms p { font-size: 11px; color: #555; line-height: 1.8; white-space: pre-wrap; }

  /* Signatures */
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px solid #999; margin-top: 50px; padding-top: 8px; }
  .sig-label { font-size: 11px; color: #555; }
  .sig-name { font-size: 12px; font-weight: 600; margin-top: 4px; }

  /* Print button */
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #1e3a5f; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
  .print-bar button { padding: 8px 24px; border: none; border-radius: 6px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-print { background: white; color: #1e3a5f; }
  .btn-close { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3) !important; }
</style>
</head>
<body>

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <button class="btn-close" onclick="window.close()">ปิด</button>
</div>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <img src="${SELLER.logo}" alt="Logo" class="header-logo" />
      <div class="seller-info">
        <h1>${SELLER.company}</h1>
        <p>${SELLER.address}</p>
        <p>เลขผู้เสียภาษี: ${SELLER.taxId}</p>
        <p>โทร: ${SELLER.phone} | ${SELLER.email}</p>
        <p>${SELLER.website}</p>
      </div>
    </div>
    <div class="doc-title">
      <h2>ใบเสนอราคา</h2>
      <div class="subtitle">QUOTATION</div>
    </div>
  </div>

  <!-- Info Grid -->
  <div class="info-grid">
    <div class="info-box">
      <div class="label">ข้อมูลลูกค้า / Customer Information</div>
      <div class="info-row"><span class="key">ชื่อ</span><span class="val">${account?.clinic_name || "-"}</span></div>
      <div class="info-row"><span class="key">ที่อยู่</span><span class="val">${account?.address || "-"}</span></div>
      <div class="info-row"><span class="key">เลขผู้เสียภาษี</span><span class="val">${account?.tax_id || "-"}</span></div>
      <div class="info-row"><span class="key">ผู้ติดต่อ</span><span class="val">${contactName}</span></div>
      <div class="info-row"><span class="key">โทร</span><span class="val">${account?.phone || "-"}</span></div>
      <div class="info-row"><span class="key">Email</span><span class="val">${account?.email || "-"}</span></div>
    </div>
    <div class="info-box">
      <div class="label">ข้อมูลเอกสาร / Document Information</div>
      <div class="info-row"><span class="key">เลขที่</span><span class="val">${qt.qt_number || "-"}</span></div>
      <div class="info-row"><span class="key">วันที่ออก</span><span class="val">${formatDate(qt.qt_date)}</span></div>
      <div class="info-row"><span class="key">หมดอายุ</span><span class="val">${expiryDate ? formatDate(expiryDate) : "-"}</span></div>
      <div class="info-row"><span class="key">เงื่อนไขชำระ</span><span class="val">${paymentLabels[qt.payment_condition] || qt.payment_condition || "-"}</span></div>
      <div class="info-row"><span class="key">ผู้ดูแล</span><span class="val">${qt.sale_assigned || "-"}</span></div>
    </div>
  </div>

  <!-- Product Table -->
  <table class="product-table">
    <thead>
      <tr>
        <th style="width:50px">#</th>
        <th>รายการสินค้า</th>
        <th style="width:80px">จำนวน</th>
        <th style="width:130px">ราคาต่อหน่วย</th>
        <th style="width:130px">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        // Parse product string "Doublo Neo x1, Trica3D x2"
        const items = (qt.product || "").split(",").map((s: string) => s.trim()).filter(Boolean);
        if (items.length === 0) {
          return `<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">ไม่มีรายการสินค้า</td></tr>`;
        }
        return items
          .map((item: string, i: number) => {
            const match = item.match(/^(.+?)\s*x(\d+)$/);
            const name = match ? match[1].trim() : item;
            const qty = match ? parseInt(match[2]) : 1;
            // We don't have per-item prices stored, show as line item
            return `<tr>
              <td>${i + 1}</td>
              <td>${name}</td>
              <td>${qty}</td>
              <td>-</td>
              <td>-</td>
            </tr>`;
          })
          .join("");
      })()}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary-section">
    <div class="summary-box">
      <div class="summary-row"><span>ยอดรวมทั้งสิ้น (Grand Total)</span></div>
      <div class="summary-row total">
        <span>Grand Total</span>
        <span>฿${formatNumber(price)}</span>
      </div>
    </div>
  </div>

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้เสนอราคา / Authorized by</div>
        <div class="sig-name">${qt.sale_assigned || "___________________"}</div>
        <div class="sig-label">วันที่ / Date: _______________</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้อนุมัติ / Approved by</div>
        <div class="sig-name">___________________</div>
        <div class="sig-label">วันที่ / Date: _______________</div>
      </div>
    </div>
  </div>
</div>

</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quotation_id } = await req.json();

    if (!quotation_id) {
      return new Response(
        JSON.stringify({ error: "quotation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch quotation with account
    const { data: qt, error: qtErr } = await supabase
      .from("quotations")
      .select("*, accounts!quotations_account_id_fkey(clinic_name, company_name, address, phone, email, tax_id)")
      .eq("id", quotation_id)
      .single();

    if (qtErr || !qt) {
      return new Response(
        JSON.stringify({ error: "Quotation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contacts
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, phone, email")
      .eq("account_id", qt.account_id)
      .order("name");

    const html = generateHTML(qt, qt.accounts, contacts || []);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

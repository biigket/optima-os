import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SELLER = {
  company: "Optima Aesthetic Co.,Ltd. (สำนักงานใหญ่)",
  address: "65 Vichitsongkram Road, Talat Nuea, Mueang, Phuket 83000",
  taxId: "0835563001787",
  phone: "0610097888",
  logo: "https://szrjikvwdygyyxfztfvn.supabase.co/storage/v1/object/public/company-assets/optima-logo.png",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function generateHTML(qt: any, account: any, contacts: any[]): string {
  const price = qt.price || 0;
  const vat = price * 7 / 107; // price is VAT-inclusive
  const priceExVat = price - vat;

  const contactName = contacts.length > 0 ? contacts[0].name : account?.clinic_name || "-";

  const paymentLabels: Record<string, string> = {
    CASH: "เงินสด",
    INSTALLMENT: "ผ่อนชำระ",
    LEASING: "ลีสซิ่ง",
  };

  // Parse product items
  const items = (qt.product || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const productRows = items.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">ไม่มีรายการสินค้า</td></tr>`
    : items.map((item: string, i: number) => {
        const match = item.match(/^(.+?)\s*x(\d+)$/);
        const name = match ? match[1].trim() : item;
        const qty = match ? parseInt(match[2]) : 1;
        const unitPrice = items.length === 1 ? price : 0;
        const total = items.length === 1 ? price : 0;
        return `<tr>
          <td class="center">${i + 1}</td>
          <td>${name}</td>
          <td class="center">${qty}</td>
          <td class="right">${unitPrice ? fmt(unitPrice) : "-"}</td>
          <td class="right">${total ? fmt(total) : "-"}</td>
        </tr>`;
      }).join("");

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
    color: #333;
    background: #f0f0f0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: white;
    padding: 18mm 20mm;
    position: relative;
  }
  
  @media print {
    body { background: white; }
    .page { margin: 0; padding: 12mm 18mm; box-shadow: none; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 0; }
  }
  
  @media screen {
    .page { box-shadow: 0 2px 20px rgba(0,0,0,0.12); margin-top: 50px; margin-bottom: 20px; }
  }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .header-left { max-width: 55%; }
  .logo { height: 60px; margin-bottom: 8px; }
  .seller-info { font-size: 12px; color: #555; line-height: 1.7; }
  
  .header-right { text-align: right; }
  .doc-title { font-size: 28px; font-weight: 700; color: #e67e22; margin-bottom: 10px; }
  
  .doc-info-table { font-size: 12px; border-collapse: collapse; }
  .doc-info-table td { padding: 3px 0; }
  .doc-info-table .lbl { color: #888; padding-right: 16px; text-align: right; white-space: nowrap; }
  .doc-info-table .val { color: #333; font-weight: 500; text-align: left; }

  /* Customer */
  .customer-section { margin-bottom: 20px; }
  .section-label { font-size: 13px; font-weight: 700; color: #e67e22; margin-bottom: 6px; }
  .customer-info { font-size: 12px; line-height: 1.8; color: #333; }

  /* Product Table */
  .product-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .product-table thead th {
    background: #fff;
    color: #333;
    font-size: 12px;
    font-weight: 600;
    padding: 10px 8px;
    border-bottom: 2px solid #e67e22;
    border-top: 2px solid #e67e22;
  }
  .product-table tbody td {
    padding: 10px 8px;
    font-size: 12px;
    border-bottom: 1px solid #eee;
  }
  .product-table .center { text-align: center; }
  .product-table .right { text-align: right; }
  .product-table th:first-child { width: 40px; text-align: center; }
  .product-table th:nth-child(3) { width: 80px; text-align: center; }
  .product-table th:nth-child(4),
  .product-table th:nth-child(5) { width: 120px; text-align: right; }

  /* Summary */
  .summary-wrapper { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
  .summary-table { margin-left: auto; font-size: 12px; border-collapse: collapse; }
  .summary-table td { padding: 5px 0; }
  .summary-table .lbl { text-align: right; padding-right: 20px; color: #555; }
  .summary-table .val { text-align: right; font-weight: 500; white-space: nowrap; }
  .summary-table .grand { border-top: 2px solid #e67e22; font-size: 14px; font-weight: 700; color: #333; }
  .summary-table .grand td { padding-top: 8px; }
  .baht-text { font-size: 12px; color: #555; margin-top: 4px; }

  /* Notes */
  .notes-section { margin-bottom: 30px; }
  .notes-section .section-label { font-size: 12px; }
  .notes-content { font-size: 12px; color: #555; line-height: 1.8; white-space: pre-wrap; }

  /* Signatures */
  .signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
  .sig-box { text-align: center; width: 200px; }
  .sig-line { border-top: 1px solid #999; padding-top: 6px; margin-top: 60px; }
  .sig-label { font-size: 11px; color: #555; }
  .sig-sub { font-size: 10px; color: #999; margin-top: 2px; }
  .stamp-area { text-align: center; flex: 1; }

  /* Print bar */
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #e67e22; padding: 10px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
  .print-bar button { padding: 8px 24px; border: none; border-radius: 6px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-print { background: white; color: #e67e22; }
  .btn-close { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4) !important; }
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
      <img src="${SELLER.logo}" alt="Optima Aesthetics" class="logo" />
      <div class="seller-info">
        ${SELLER.company}<br/>
        ${SELLER.address}<br/>
        เลขประจำตัวผู้เสียภาษี ${SELLER.taxId}<br/>
        โทร. ${SELLER.phone}
      </div>
    </div>
    <div class="header-right">
      <div class="doc-title">ใบเสนอราคา</div>
      <table class="doc-info-table">
        <tr><td class="lbl">เลขที่</td><td class="val">${qt.qt_number || "-"}</td></tr>
        <tr><td class="lbl">วันที่</td><td class="val">${fmtDate(qt.qt_date)}</td></tr>
        <tr><td class="lbl">ผู้ขาย</td><td class="val">${qt.sale_assigned || "Optima Aesthetics"}</td></tr>
        
      </table>
    </div>
  </div>

  <!-- Customer -->
  <div class="customer-section">
    <div class="section-label">ลูกค้า</div>
    <div class="customer-info">
      ${contactName}<br/>
      ${account?.address || "-"}<br/>
      ${account?.tax_id ? "เลขประจำตัวผู้เสียภาษี " + account.tax_id : ""}
    </div>
  </div>

  <!-- Product Table -->
  <table class="product-table">
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left">รายละเอียด</th>
        <th>จำนวน</th>
        <th>ราคาต่อหน่วย</th>
        <th>ยอดรวม</th>
      </tr>
    </thead>
    <tbody>
      ${productRows}
    </tbody>
  </table>

  <!-- Summary -->
  <div class="summary-wrapper">
    <div></div>
    <div>
      <table class="summary-table">
        <tr><td class="lbl">รวมเป็นเงิน</td><td class="val">${fmt(price)} บาท</td></tr>
        <tr><td class="lbl">ภาษีมูลค่าเพิ่ม 7%</td><td class="val">${fmt(vat)} บาท</td></tr>
        <tr><td class="lbl">ราคาไม่รวมภาษีมูลค่าเพิ่ม</td><td class="val">${fmt(priceExVat)} บาท</td></tr>
        <tr class="grand"><td class="lbl">จำนวนเงินรวมทั้งสิ้น</td><td class="val">${fmt(price)} บาท</td></tr>
      </table>
    </div>
  </div>

  <!-- Notes -->
  ${qt.notes || qt.payment_condition ? `
  <div class="notes-section">
    <div class="section-label">หมายเหตุ</div>
    <div class="notes-content">${qt.payment_condition ? paymentLabels[qt.payment_condition] || qt.payment_condition : ""}${qt.notes ? "\n" + qt.notes : ""}</div>
  </div>` : ""}

  <!-- Signatures -->
  <div class="signatures">
    <div class="sig-box">
      <div style="font-size:12px;color:#555;">ในนาม ${contactName}</div>
      <div class="sig-line">
        <div class="sig-label">ผู้สั่งซื้อสินค้า</div>
        <div class="sig-sub">วันที่</div>
      </div>
    </div>
    <div class="stamp-area"></div>
    <div class="sig-box">
      <div style="font-size:12px;color:#555;">ในนาม Optima Aesthetic Co.,Ltd.</div>
      <div class="sig-line">
        <div class="sig-label">ผู้อนุมัติ</div>
        <div class="sig-sub">วันที่</div>
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

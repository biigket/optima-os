import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SELLER = {
  company: "บริษัท ออปติม่าแอสเทติค จำกัด (สำนักงานใหญ่)",
  companyEn: "Optima Aesthetic Co.,Ltd.",
  address: "65 ถ.วิชิตสงคราม ต.ตลาดเหนือ อ.เมือง จ.ภูเก็ต 83000",
  taxId: "0835563001787",
  phone: "061-009-7888",
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

// Color themes per document type
const THEMES = {
  BN: { primary: "#7c3aed", secondary: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", barBg: "#7c3aed" }, // purple
  IV: { primary: "#1e40af", secondary: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe", barBg: "#1e40af" }, // deep blue
  DN: { primary: "#e67e22", secondary: "#b5651d", bg: "#fef9f3", border: "#f0d9b5", barBg: "#e67e22" }, // orange
};

function getDocStyles(theme: typeof THEMES.BN): string {
  return `
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
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .header-left { max-width: 55%; }
  .logo { height: 60px; margin-bottom: 8px; }
  .seller-info { font-size: 12px; color: #555; line-height: 1.7; }
  .header-right { text-align: right; }
  .doc-title { font-size: 26px; font-weight: 700; color: ${theme.primary}; margin-bottom: 4px; }
  .doc-title-en { font-size: 14px; font-weight: 600; color: ${theme.secondary}; margin-bottom: 10px; }
  .doc-info-table { font-size: 12px; border-collapse: collapse; }
  .doc-info-table td { padding: 3px 0; }
  .doc-info-table .lbl { color: #888; padding-right: 16px; text-align: right; white-space: nowrap; }
  .doc-info-table .val { color: #333; font-weight: 500; text-align: left; }
  .section-label { font-size: 13px; font-weight: 700; color: ${theme.primary}; margin-bottom: 6px; }
  .customer-section { margin-bottom: 20px; }
  .customer-info { font-size: 12px; line-height: 1.8; color: #333; }
  .product-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .product-table thead th {
    background: #fff; color: #333; font-size: 12px; font-weight: 600;
    padding: 10px 8px; border-bottom: 2px solid ${theme.primary}; border-top: 2px solid ${theme.primary};
  }
  .product-table tbody td { padding: 10px 8px; font-size: 12px; border-bottom: 1px solid #eee; }
  .product-table .center { text-align: center; }
  .product-table .right { text-align: right; }
  .product-table th:first-child { width: 40px; text-align: center; }
  .product-table th:nth-child(3) { width: 80px; text-align: center; }
  .product-table th:nth-child(4), .product-table th:nth-child(5) { width: 120px; text-align: right; }
  .summary-wrapper { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
  .summary-table { margin-left: auto; font-size: 12px; border-collapse: collapse; }
  .summary-table td { padding: 5px 0; }
  .summary-table .lbl { text-align: right; padding-right: 20px; color: #555; }
  .summary-table .val { text-align: right; font-weight: 500; white-space: nowrap; }
  .summary-table .grand { border-top: 2px solid ${theme.primary}; font-size: 14px; font-weight: 700; color: #333; }
  .summary-table .grand td { padding-top: 8px; }
  .ref-section { margin-bottom: 20px; padding: 12px; background: ${theme.bg}; border-radius: 6px; border: 1px solid ${theme.border}; }
  .ref-section p { font-size: 12px; line-height: 1.8; color: #555; }
  .ref-section .ref-label { font-weight: 600; color: #333; }
  .signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
  .sig-box { text-align: center; width: 220px; }
  .sig-line { border-top: 1px solid #999; padding-top: 6px; margin-top: 60px; }
  .sig-label { font-size: 11px; color: #555; }
  .sig-sub { font-size: 10px; color: #999; margin-top: 2px; }
  .stamp-area { text-align: center; flex: 1; }
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: ${theme.barBg}; padding: 10px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
  .print-bar button { padding: 8px 24px; border: none; border-radius: 6px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
  .btn-print { background: white; color: ${theme.primary}; }
  .btn-close { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4) !important; }
  .payment-info { margin-bottom: 20px; }
  .payment-info table { font-size: 12px; border-collapse: collapse; }
  .payment-info td { padding: 4px 12px 4px 0; }
  .payment-info .lbl { color: #888; }
  .payment-info .val { font-weight: 500; }
  `;
}

function renderHeader(docTitleTh: string, docTitleEn: string, docNumber: string, docDate: string): string {
  return `
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
      <div class="doc-title">${docTitleTh}</div>
      <div class="doc-title-en">${docTitleEn}</div>
      <table class="doc-info-table">
        <tr><td class="lbl">เลขที่</td><td class="val">${docNumber}</td></tr>
        <tr><td class="lbl">วันที่</td><td class="val">${docDate}</td></tr>
      </table>
    </div>
  </div>`;
}

function renderCustomer(account: any): string {
  return `
  <div class="customer-section">
    <div class="section-label">ลูกค้า</div>
    <div class="customer-info">
      ${account?.clinic_name || "-"}<br/>
      ${account?.address || "-"}<br/>
      ${account?.tax_id ? "เลขประจำตัวผู้เสียภาษี " + account.tax_id : ""}
      ${account?.phone ? "<br/>โทร. " + account.phone : ""}
    </div>
  </div>`;
}

function renderProductTable(qt: any, amount: number, suffix: string = ""): string {
  const items = (qt.product || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  const productRows = items.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#999;padding:20px">ไม่มีรายการสินค้า</td></tr>`
    : items.map((item: string, i: number) => {
        const match = item.match(/^(.+?)\s*x(\d+)$/);
        const name = match ? match[1].trim() : item;
        const qty = match ? parseInt(match[2]) : 1;
        const unitPrice = items.length === 1 ? amount : 0;
        const total = items.length === 1 ? amount : 0;
        return `<tr>
          <td class="center">${i + 1}</td>
          <td>${name}${suffix ? " " + suffix : ""}</td>
          <td class="center">${qty}</td>
          <td class="right">${unitPrice ? fmt(unitPrice) : "-"}</td>
          <td class="right">${total ? fmt(total) : "-"}</td>
        </tr>`;
      }).join("");

  return `
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
    <tbody>${productRows}</tbody>
  </table>`;
}

function renderSummary(amount: number): string {
  const vat = amount * 7 / 107;
  const exVat = amount - vat;

  return `
  <div class="summary-wrapper">
    <div></div>
    <div>
      <table class="summary-table">
        <tr><td class="lbl">ราคาไม่รวมภาษี</td><td class="val">${fmt(exVat)} บาท</td></tr>
        <tr><td class="lbl">ภาษีมูลค่าเพิ่ม 7%</td><td class="val">${fmt(vat)} บาท</td></tr>
        <tr class="grand"><td class="lbl">จำนวนเงินรวมทั้งสิ้น</td><td class="val">${fmt(amount)} บาท</td></tr>
      </table>
    </div>
  </div>`;
}

function renderSignatures(): string {
  return `
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้รับเอกสาร</div>
        <div class="sig-sub">วันที่ _______________</div>
      </div>
    </div>
    <div class="stamp-area"></div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้ออกเอกสาร</div>
        <div class="sig-sub">ในนาม ${SELLER.companyEn}</div>
      </div>
    </div>
  </div>`;
}

function calcDeposit(qt: any): number {
  const price = qt.price || 0;
  if (!qt.deposit_type || qt.deposit_type === 'NONE' || !qt.deposit_value) return 0;
  if (qt.deposit_type === 'AMOUNT') return qt.deposit_value;
  if (qt.deposit_type === 'PERCENT') return Math.round(price * qt.deposit_value / 100);
  return 0;
}

// ==================== Billing Note (Purple, ref QT) ====================
function generateBillingNote(qt: any, account: any, docNumber: string, docDate: string, depositAmount: number): string {
  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบวางบิล ${docNumber}</title><style>${getDocStyles(THEMES.BN)}</style></head><body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <button class="btn-close" onclick="window.close()">ปิด</button>
</div>
<div class="page">
  ${renderHeader("ใบวางบิล", "Billing Note", docNumber, docDate)}
  ${renderCustomer(account)}
  <div class="ref-section">
    <p><span class="ref-label">อ้างอิงใบเสนอราคา:</span> ${qt.qt_number || "-"}</p>
    <p><span class="ref-label">ยอดรวมตามสัญญา:</span> ฿${fmt(qt.price || 0)}</p>
    <p><span class="ref-label">ยอดมัดจำ:</span> ฿${fmt(depositAmount)} ${qt.deposit_type === 'PERCENT' ? `(${qt.deposit_value}%)` : ''}</p>
  </div>
  ${renderProductTable(qt, depositAmount)}
  ${renderSummary(depositAmount)}
  ${renderSignatures()}
</div></body></html>`;
}

// ==================== Tax Invoice (Deep Blue, ref BN) ====================
function generateTaxInvoice(qt: any, account: any, docNumber: string, docDate: string, depositAmount: number, bnNumber: string): string {
  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบกำกับภาษี ${docNumber}</title><style>${getDocStyles(THEMES.IV)}</style></head><body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <button class="btn-close" onclick="window.close()">ปิด</button>
</div>
<div class="page">
  ${renderHeader("ใบกำกับภาษี", "Tax Invoice", docNumber, docDate)}
  ${renderCustomer(account)}
  <div class="ref-section">
    <p><span class="ref-label">อ้างอิงใบวางบิล:</span> ${bnNumber || "-"}</p>
    <p><span class="ref-label">อ้างอิงใบเสนอราคา:</span> ${qt.qt_number || "-"}</p>
    <p><span class="ref-label">ประเภท:</span> ค่ามัดจำสินค้า</p>
  </div>
  ${renderProductTable(qt, depositAmount)}
  ${renderSummary(depositAmount)}
  ${renderSignatures()}
</div></body></html>`;
}

// ==================== Delivery Note (Orange) ====================
function generateDeliveryNote(qt: any, account: any, docNumber: string, docDate: string, depositAmount: number): string {
  const items = (qt.product || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const productRows = items.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:#999;padding:20px">ไม่มีรายการสินค้า</td></tr>`
    : items.map((item: string, i: number) => {
        const match = item.match(/^(.+?)\s*x(\d+)$/);
        const name = match ? match[1].trim() : item;
        const qty = match ? parseInt(match[2]) : 1;
        return `<tr>
          <td class="center">${i + 1}</td>
          <td>${name}</td>
          <td class="center">${qty}</td>
          <td>-</td>
        </tr>`;
      }).join("");

  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบส่งของ ${docNumber}</title><style>${getDocStyles(THEMES.DN)}</style></head><body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <button class="btn-close" onclick="window.close()">ปิด</button>
</div>
<div class="page">
  ${renderHeader("ใบส่งของ", "Delivery Note", docNumber, docDate)}
  ${renderCustomer(account)}
  <div class="ref-section">
    <p><span class="ref-label">อ้างอิงใบเสนอราคา:</span> ${qt.qt_number || "-"}</p>
    <p><span class="ref-label">ยอดมัดจำที่ชำระแล้ว:</span> ฿${fmt(depositAmount)}</p>
  </div>
  <table class="product-table">
    <thead>
      <tr>
        <th>#</th>
        <th style="text-align:left">รายละเอียดสินค้า</th>
        <th>จำนวน</th>
        <th style="text-align:left">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>${productRows}</tbody>
  </table>
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้รับสินค้า</div>
        <div class="sig-sub">วันที่ _______________</div>
      </div>
    </div>
    <div class="stamp-area"></div>
    <div class="sig-box">
      <div class="sig-line">
        <div class="sig-label">ผู้ส่งสินค้า</div>
        <div class="sig-sub">ในนาม ${SELLER.companyEn}</div>
      </div>
    </div>
  </div>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quotation_id, doc_type } = await req.json();

    if (!quotation_id) {
      return new Response(JSON.stringify({ error: "quotation_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ error: "Quotation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const account = qt.accounts;
    const depositAmount = calcDeposit(qt);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const docDate = fmtDate(now.toISOString());

    // Auto-generate numbers if not yet generated
    let bnNumber = qt.billing_note_number;
    let ivNumber = qt.tax_invoice_number;
    let dnNumber = qt.delivery_note_number;
    let generatedAt = qt.docs_generated_at;

    if (!bnNumber || !ivNumber || !dnNumber) {
      const { data: bnNum } = await supabase.rpc("get_next_doc_number", { p_doc_type: "BN", p_year_month: yearMonth });
      const { data: ivNum } = await supabase.rpc("get_next_doc_number", { p_doc_type: "IV", p_year_month: yearMonth });
      const { data: dnNum } = await supabase.rpc("get_next_doc_number", { p_doc_type: "DN", p_year_month: yearMonth });

      const monthStr = yearMonth.replace("-", "");
      bnNumber = `BN-${monthStr}-${String(bnNum).padStart(4, "0")}`;
      ivNumber = `IV-${monthStr}-${String(ivNum).padStart(4, "0")}`;
      dnNumber = `DN-${monthStr}-${String(dnNum).padStart(4, "0")}`;
      generatedAt = now.toISOString();

      await supabase.from("quotations").update({
        billing_note_number: bnNumber,
        tax_invoice_number: ivNumber,
        delivery_note_number: dnNumber,
        docs_generated_at: generatedAt,
      }).eq("id", quotation_id);
    }

    const displayDate = fmtDate(generatedAt);

    // If doc_type is specified, render that single document
    if (doc_type === 'BN') {
      const html = generateBillingNote(qt, account, bnNumber, displayDate, depositAmount);
      return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }
    if (doc_type === 'IV') {
      const html = generateTaxInvoice(qt, account, ivNumber, displayDate, depositAmount, bnNumber);
      return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }
    if (doc_type === 'DN') {
      const html = generateDeliveryNote(qt, account, dnNumber, displayDate, depositAmount);
      return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
    }

    // Default: return numbers
    return new Response(JSON.stringify({
      billing_note_number: bnNumber,
      tax_invoice_number: ivNumber,
      delivery_note_number: dnNumber,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

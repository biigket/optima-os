import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SELLER = {
  company_th: "บริษัท ออปติม่าแอสเทติค จำกัด",
  company_en: "Optima Aesthetics Co.,Ltd.",
  address_th: "65 ถนนวิชิตสงคราม ตำบลตลาดเหนือ อำเภอเมือง จังหวัดภูเก็ต 83000",
  address_en: "65 Vichitsongkram Rd., Talad Nuea, Muang, Phuket, 83000",
  phone: "061-009-7888",
  logo: "https://szrjikvwdygyyxfztfvn.supabase.co/storage/v1/object/public/company-assets/optima-logo.png",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(d: string | null): string {
  if (!d) return "_______________";
  const date = new Date(d);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function fmtDateThai(d: string | null): string {
  if (!d) return "_______________";
  const date = new Date(d);
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;
  return `${day} ${month} ${thaiYear}`;
}

function fmtDateThaiShort(d: string | null): string {
  if (!d) return "_______________";
  const date = new Date(d);
  const months = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;
  return `${day} ${month} ${thaiYear}`;
}

function numberToThaiText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const intPart = Math.floor(num);
  let result = "";
  const str = intPart.toString();
  const len = str.length;
  
  for (let i = 0; i < len; i++) {
    const d = parseInt(str[i]);
    const pos = len - i - 1;
    
    if (d === 0) continue;
    if (pos === 0 && d === 1 && len > 1) { result += "เอ็ด"; continue; }
    if (pos === 1 && d === 1) { result += "สิบ"; continue; }
    if (pos === 1 && d === 2) { result += "ยี่สิบ"; continue; }
    
    result += digits[d] + positions[pos];
  }
  
  return result + "บาทถ้วน";
}

function pageHeader(contractNumber: string): string {
  return `
  <div class="header">
    <div class="header-left">
      <img src="${SELLER.logo}" class="logo" alt="Optima" />
    </div>
    <div class="header-right">
      <div class="th">${SELLER.company_th}</div>
      <div class="th">65 ถนนวิชิตสงคราม ตำบลตลาดเหนือ</div>
      <div class="th">อำเภอเมือง จังหวัดภูเก็ต 83000</div>
      <div class="en">${SELLER.company_en}</div>
      <div class="en">${SELLER.address_en}</div>
    </div>
  </div>
  <div class="contract-no">สัญญาเลขที่ ${contractNumber}</div>`;
}

function generateHTML(contract: any, account: any, contacts: any[]): string {
  const accessories = (contract.product_accessories || []) as any[];
  const warrantyDetails = (contract.warranty_details || []) as any[];
  const appendixItems = (contract.appendix_items || []) as any[];
  const paymentDetails = (contract.payment_details || []) as any[];
  
  const totalPrice = contract.total_price || 0;
  const depositAmount = contract.deposit_amount || 0;
  const remainingAmount = contract.remaining_amount || 0;
  const installmentCount = contract.installment_count || 1;
  const deliveryDays = contract.delivery_days || 60;
  const warrantyYears = contract.warranty_years || 1;
  
  const buyerCompany = contract.buyer_company_name || account?.company_name || account?.clinic_name || "";
  const buyerRep = contract.buyer_representative_name || "";
  const buyerIdNumber = contract.buyer_id_number || "";
  const buyerIdExpiry = contract.buyer_id_expiry || "";
  const buyerAddress = contract.buyer_address || account?.address || "";
  const buyerPhone = contract.buyer_phone || account?.phone || "";
  const sellerRep = contract.seller_representative_name || "นายแพทย์ฐิติคมน์ ลิ้มรัตนเมฆา";
  
  const productName = contract.product_name || "NEW DOUBLO 2.0";
  const productBrand = contract.product_brand || "HIRONIC";
  const productOrigin = contract.product_origin || "ประเทศเกาหลี";
  const productQuantity = contract.product_quantity || 1;
  const qtNumber = contract.qt_number || "";
  const contractNumber = contract.contract_number || "";
  const contractDate = contract.contract_date || "";
  const deliveryAddress = contract.delivery_address || buyerAddress;
  
  // Accessories list
  const accessoriesHTML = accessories.map((a: any, i: number) => 
    `<div style="margin-left:80px;margin-bottom:4px;">1.1.${i + 1}&nbsp;&nbsp;&nbsp;&nbsp;${a.name} จำนวน ${a.quantity} (${numberToThaiQuantity(a.quantity)}) ${a.unit}</div>`
  ).join("");
  
  // Warranty table rows
  const warrantyRows = warrantyDetails.map((w: any, i: number) =>
    `<tr>
      <td style="padding:6px 10px;border:1px solid #ccc;text-align:center;">${i + 1}.</td>
      <td style="padding:6px 10px;border:1px solid #ccc;">${w.item}</td>
      <td style="padding:6px 10px;border:1px solid #ccc;">${w.warranty}</td>
      <td style="padding:6px 10px;border:1px solid #ccc;">${w.note || ""}</td>
    </tr>`
  ).join("");
  
  // Appendix items
  const appendixHTML = appendixItems.map((a: any, i: number) =>
    `<div style="margin-bottom:6px;display:flex;gap:20px;">
      <div>${i + 1}. ${a.name}</div>
      <div>${a.detail}</div>
    </div>`
  ).join("");

  // Payment installment details
  let paymentHTML = "";
  if (installmentCount > 1) {
    paymentHTML = `
      <div style="margin-top:8px;margin-bottom:4px;"><strong>2.1</strong>&nbsp;&nbsp;&nbsp;&nbsp;ชำระค่าเครื่องมือแพทย์ตามข้อ 1. ให้ "ผู้ขาย" งวดที่ 1 เป็นจำนวนเงิน <strong>${fmtInt(depositAmount)}.-</strong> บาท <strong>(${numberToThaiText(depositAmount).replace("บาทถ้วน","")})</strong></div>
      <div style="margin-left:0;margin-bottom:4px;">โดยชำระด้วยการโอนเงินเข้าบัญชีในนาม <strong>บริษัท ออปติม่าแอสเทติค จำกัด เลขที่บัญชี 411-0-748-56-8 (ธนาคารไทยพาณิชย์)</strong></div>
      <div style="margin-top:8px;margin-bottom:4px;"><strong>2.2</strong>&nbsp;&nbsp;&nbsp;&nbsp;ผู้ซื้อจะดำเนินการชำระเงินค่าสินค้าประเภทเครื่องมือแพทย์ในส่วนที่เหลือเป็นจำนวนเงิน <strong>${fmtInt(remainingAmount)}</strong> บาท</div>
      <div style="margin-bottom:4px;"><strong>(${numberToThaiText(remainingAmount).replace("บาทถ้วน","บาทถ้วน")})</strong> ผ่านบัตรเครดิต</div>
    `;
  } else {
    paymentHTML = `
      <div style="margin-top:8px;margin-bottom:4px;"><strong>2.1</strong>&nbsp;&nbsp;&nbsp;&nbsp;ชำระค่าเครื่องมือแพทย์ตามข้อ 1. ให้ "ผู้ขาย" เต็มจำนวนเป็นเงิน <strong>${fmtInt(totalPrice)}.-</strong> บาท <strong>(${numberToThaiText(totalPrice)})</strong></div>
    `;
  }

  const thaiYear = contractDate ? new Date(contractDate).getFullYear() + 543 : "____";
  
  const pageStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', sans-serif; font-size: 15px; color: #1a1a1a; background: #e8e8e8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; padding: 15mm 20mm 20mm 25mm; position: relative; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    @media print { body { background: white; } .page { margin: 0; padding: 12mm 18mm 18mm 22mm; box-shadow: none; } .no-print { display: none !important; } @page { size: A4; margin: 0; } }
    @media screen { .page { box-shadow: 0 4px 24px rgba(0,0,0,0.15); margin-top: 20px; margin-bottom: 20px; } .page:first-child { margin-top: 50px; } }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .header-left { }
    .header-left .logo { height: 80px; }
    .header-right { text-align: right; line-height: 1.5; font-size: 14px; }
    .header-right .th { color: #1a1a1a; font-weight: 400; }
    .header-right .en { color: #444; font-size: 13px; }
    .contract-no { text-align: right; font-size: 15px; margin-bottom: 16px; margin-top: 4px; }
    h2 { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
    .date-line { text-align: center; margin-bottom: 18px; font-size: 15px; }
    .body-text { line-height: 2; text-align: justify; font-size: 15px; margin-bottom: 6px; }
    .indent { text-indent: 48px; }
    .section-title { font-weight: 700; text-decoration: underline; margin-top: 14px; margin-bottom: 8px; font-size: 15px; }
    .sig-section { margin-top: 40px; }
    .sig-row { display: flex; justify-content: space-between; margin-bottom: 36px; }
    .sig-box { text-align: center; width: 44%; }
    .sig-line { margin-top: 44px; }
    .sig-dots { letter-spacing: 2px; }
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #e67e22; padding: 10px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
    .print-bar button { padding: 8px 24px; border: none; border-radius: 6px; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-print { background: white; color: #e67e22; }
    .btn-close { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4) !important; }
  `;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>สัญญาซื้อขาย ${contractNumber}</title>
<style>${pageStyle}</style>
</head>
<body>

<div class="print-bar no-print">
  <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button>
  <button class="btn-close" onclick="window.close()">ปิด</button>
</div>

<!-- PAGE 1 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <h2>สัญญาซื้อขายเครื่องมือแพทย์</h2>
  <div class="date-line">วันที่ ${fmtDateThai(contractDate)}</div>
  
  <div class="body-text indent">
    สัญญาซื้อขายฉบับนี้ทำขึ้นระหว่าง
  </div>
  
  <div class="body-text indent">
    ผู้ซื้อคือ <strong>${buyerCompany}</strong> โดย <strong>${buyerRep}</strong> ${buyerIdNumber ? `บัตรประชาชนเลขที่ <strong>${buyerIdNumber}</strong>` : ""}
    ${buyerIdExpiry ? ` หมดอายุ <strong>${fmtDateThaiShort(buyerIdExpiry)}</strong>` : ""}
    ซึ่งเป็นผู้มีอำนาจลงนามในสัญญาฉบับนี้ มีที่อยู่ตามบัตรประชาชนเลขที่ <strong>${buyerAddress}</strong> โทรศัพท์ <strong>${buyerPhone}</strong>
    ซึ่งเป็นผู้มีอำนาจลงนามในสัญญาฉบับนี้ เป็นคู่สัญญาฝาย
  </div>
  
  <div class="body-text" style="font-weight:700;text-align:center;margin:12px 0;">หนึ่ง</div>
  
  <div class="body-text indent">
    ผู้ขาย คือ <strong>${SELLER.company_th}</strong> โดย <strong>${sellerRep}</strong> ซึ่งเป็นผู้มีอำนาจลงนามในสัญญาฉบับนี้
    แทนบริษัท โดยบริษัทมีสำนักงานใหญ่ตั้งอยู่ที่ เลขที่ ${SELLER.address_th}
    โทรศัพท์ ${SELLER.phone}
  </div>

  <div class="section-title">ข้อตกลงซื้อขาย</div>
  
  <div class="body-text">
    <strong>ข้อ 1.</strong> ผู้ซื้อตกลงซื้อและผู้ขายตกลงขายสินค้า ซึ่งในที่นี้ต่อไปเรียกว่า "เครื่องมือแพทย์หรือสินค้า" ที่มีชื่อว่า เครื่อง <strong>${productName}</strong> 
    ยี่ห้อ <strong>${productBrand}</strong> จากประเทศ${productOrigin} จำนวน ${productQuantity} (${numberToThaiQuantity(productQuantity)}) เครื่อง 
    โดยคุณสมบัติและรายละเอียดเอกสารที่ได้แนบท้ายสัญญาฉบับนี้ ให้ถือเป็นส่วนหนึ่งของสัญญาฉบับนี้ด้วย โดยมีรายละเอียดสินค้า ดังต่อไปนี้
  </div>
  
  <div style="margin-left:40px;margin-bottom:8px;">
    <strong>1.1</strong>&nbsp;&nbsp;&nbsp;&nbsp;เครื่อง ${productName} (THAIFDA,KFDA,CE) จำนวน ${productQuantity} (${numberToThaiQuantity(productQuantity)}) เครื่อง พร้อมอุปกรณ์ประกอบ คือ
  </div>
  ${accessoriesHTML}

  <div class="section-title">ข้อตกลงในการชำระค่าสินค้า</div>
  
  <div class="body-text">
    <strong>ข้อ 2.</strong> "ผู้ขาย" และ "ผู้ซื้อ" ได้ตกลงกันทำราคาซื้อขาย "เครื่องมือแพทย์" ตามข้อ1. จำนวน ${productQuantity} (${numberToThaiQuantity(productQuantity)}) เครื่อง ราคารวมภาษี
    มูลค่าเพิ่มแล้ว โดยผู้ซื้อตกลงยินยอมชำระราคาเครื่องมือแพทย์ดังกล่าว เป็นเงินจำนวนทั้งสิ้น
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text">
    <strong>${fmtInt(totalPrice)}.- (${numberToThaiText(totalPrice)})</strong> ตามใบเสนอราคาเลขที่ <strong>${qtNumber}</strong> ให้แก่ผู้ขาย โดยมีรายละเอียดแบ่งชำระราคาเครื่องมือแพทย์เป็น ${installmentCount} งวดดังต่อไปนี้
  </div>
  
  ${paymentHTML}
  
  <div class="body-text" style="margin-top:16px;">
    <strong>"ผู้ขาย" ขอสงวนสิทธิ์สำหรับราคาขายและเงื่อนไขการชำระเงิน ซึ่งเป็นเงื่อนไขพิเศษเฉพาะการซื้อขายตามสัญญาซื้อขายฉบับนี้เท่านั้น</strong>
  </div>

  <div class="section-title">การส่งมอบและรับมอบเครื่องมือแพทย์ที่ซื้อขาย</div>
  
  <div class="body-text">
    <strong>ข้อ 3.</strong> ผู้ขายตกลงยินยอมส่งมอบและทำการติดตั้งเครื่องมือแพทย์ที่ตกลงซื้อขาย ให้แก่ผู้ซื้อภายในวันที่ตกลงกับผู้ซื้อ
    โดย ผู้ขายจะทำการส่งมอบและติดตั้ง ไม่เกิน ${deliveryDays} (${numberToThaiQuantity(deliveryDays)}) วัน นับตั้งแต่วันที่ผู้ซื้อและผู้ขายลงนามทำสัญญาซื้อขายฉบับนี้ทั้งสองฝ่าย
  </div>
  
  <div class="body-text">
    <strong>ข้อ 4.</strong> ผู้ขายตกลงยินยอมส่งมอบและทำการติดตั้งเครื่องมือแพทย์ที่ตกลงซื้อขาย ให้แก่ผู้ซื้อภายในวันที่ตกลงกับผู้ซื้อ ณ
    สถานที่ที่ ผู้ซื้อใช้สอยเครื่องมือแพทย์ที่ตกลงซื้อขายคือที่ <strong>${deliveryAddress}</strong>
    อย่างไรก็ตาม หากมีเหตุขัดข้องที่ทำให้ทางผู้ขายไม่สามารถส่งสินค้าได้ภายในวันที่กำหนด ไม่ว่าด้วยเหตุใดๆ ผู้ขาย
    จะแจ้งให้ผู้ซื้อทราบล่วงหน้าและผู้ซื้อตกลงยินยอมขยายระยะเวลาส่งมอบออกไป ตามกำหนดที่ผู้ขายแจ้ง ทั้งนี้ ผู้ขายจะทำการส่งมอบ
    และติดตั้ง ไม่เกิน ${deliveryDays} (${numberToThaiQuantity(deliveryDays)}) วัน นับแต่วันที่ผู้ซื้อและผู้ขายลงนามทำสัญญาซื้อขายฉบับนี้ทั้งสองฝ่าย
  </div>
</div>

<!-- PAGE 3 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text indent">
    เมื่อทำสัญญาซื้อขายฉบับนี้แล้ว หากผู้ซื้อมีความประสงค์จะขอเปลี่ยนแปลงสถานที่ส่งมอบและติดตั้ง และ/หรือ จะขอขยาย
    กำหนดระยะเวลาส่งมอบและติดตั้งออกไปเกินกว่า ${deliveryDays} (${numberToThaiQuantity(deliveryDays)}) วัน ผู้ซื้อตกลงยินยอมแจ้งให้ผู้ขายทราบเป็นลายลักษณ์อักษรล่วงหน้า
    ก่อนถึงกำหนดส่งมอบตามกำหนดไม่น้อยกว่า 30 (สามสิบ) วัน ก่อนถึงกำหนดส่งมอบและติดตั้ง ทั้งนี้สำหรับการส่งมอบตาม
    กำหนดระยะเวลาที่ผู้ซื้อขอขยายออกไปนั้น เป็นหน้าที่ของผู้ซื้อที่จะต้องแจ้งกำหนด
    ระยะเวลาส่งมอบและติดตั้งที่แน่นอนให้แก่ผู้ขายทราบล่วงหน้าไม่น้อยกว่า 60 (หกสิบ) วัน ก่อนถึงกำหนดส่งมอบและติดตั้ง
    ซึ่งในครั้งที่ขยายออกไป เพื่อให้ผู้ขายได้จัดเตรียมเครื่องมือแพทย์ที่ซื้อขายตามข้อ 1. ให้เรียบร้อยเสียก่อน
  </div>
  
  <div class="body-text indent">
    ในขณะที่ส่งมอบและติดตั้งเครื่องมือแพทย์ที่ตกลงซื้อขาย ผู้ขายมีหน้าที่ในการติดตั้ง แนะนำวิธีใช้งานเครื่องและทำการ
    ทดสอบระบบการทำงานต่างๆให้แก่ผู้ซื้อรับทราบ เพื่อที่จะให้ผู้ซื้อได้ทำการตรวจเข้าใจและสอบถามวิธีการใช้งานจริงและ
    ทดสอบการทำงานของระบบการทำงานต่างๆ ของเครื่องมือแพทย์ที่ตกลงซื้อขายอย่างครบถ้วน
  </div>
  
  <div class="body-text indent">
    ผู้ซื้อมีหน้าที่ในการตรวจจริงและทดสอบความเรียบร้อยของเครื่องมือแพทย์ตามข้อ 1. และมีหน้าที่ในการตรวจจริงและทดสอบ
    ระบบการทำงานต่างๆ หากผู้ซื้อรับมอบเครื่องมือแพทย์ที่ตกลงซื้อขายและลงลายมือชื่อในใบส่งของหรือใบรับของเป็นที่เรียบร้อยแล้ว
    โดยไม่ทักท้วงหรือไม่โต้แย้ง ถือว่า ผู้ซื้อได้รับมอบสินค้าที่มีสภาพดีครบถ้วนสมบูรณ์เป็นปกติพร้อมใช้งานที่ประกาศ
  </div>

  <div class="section-title">การโอนกรรมสิทธิ์ในเครื่องมือแพทย์ที่ซื้อขาย</div>
  
  <div class="body-text">
    <strong>ข้อ 5.</strong> กรรมสิทธิ์ในเครื่องมือแพทย์ที่ตกลงซื้อขายตามข้อ 1. จะโอนไปยังผู้ซื้อต่อเมื่อ "ผู้ซื้อ" ได้ชำระราคาค่าเครื่องมือ
    แพทย์ตามข้อ 2. ในสัญญานี้แก่ "ผู้ขาย" และผู้ขายได้รับเงินที่ผู้ซื้อชำระราคาค่าซื้อขายเครื่องมือแพทย์เป็นที่ครบถ้วนถูกต้องที่
    ประกาศ โดยในระหว่างที่เครื่องมือแพทย์ยังอยู่ในความครอบครองของผู้ขาย และยังไม่ได้ลงนามรับเครื่องมือแพทย์ตามข้อ 4. ผู้ขาย
    จะรับผิดชอบต่อความเสียหายใดๆอันเกิดแก่เครื่องมือแพทย์ทั้งสิ้น
  </div>
  
  <div class="body-text">
    <strong>ข้อ 6.</strong> ในกรณีที่กรรมสิทธิ์ในเครื่องมือแพทย์ที่ตกลงซื้อขายตามข้อ 1. ยังไม่โอนไปยังผู้ซื้อต่อเมื่อผู้ซื้อได้รับมอบสินค้าจาก
    ผู้ขายเป็นที่เรียบร้อยแล้วตามข้อ 4. ผู้ซื้อตกลงยินยอมที่จะดูแลรักษาและใช้สอยสินค้าตามวิธีการปกติที่ไป และจะใช้สอยสินค้า ณ
    สถานที่ที่ส่งมอบและติดตั้งสินค้าตามข้อ 4. เท่านั้น
  </div>
</div>

<!-- PAGE 4 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text indent">
    นอกจากนี้ ผู้ซื้อตกลงยินยอมและให้คำมั่นสัญญาว่า ผู้ซื้อจะไม่ขาย จำหน่ายจ่ายโอน ยักย้ายถ่ายเทเปลี่ยนแปลง
    สถานที่ใช้สอยที่ติดตั้งเครื่องมือแพทย์หรือส่งมอบเครื่องมือแพทย์ที่ตกลงซื้อขายตามข้อ 1. ให้แก่บุคคลอื่น ทั้งจะไม่ยินยอมให้
    บุคคลอื่นนำเครื่องมือแพทย์ที่ตกลงซื้อขายตามข้อ 1. ไปขาย จำหน่ายจ่ายโอน ยักย้ายถ่ายเทเปลี่ยนแปลงสถานที่ใช้สอยที่ติดตั้ง หรือ
    ส่งมอบเครื่องมือแพทย์ดังกล่าว ให้แก่ใดผู้หนึ่ง เว้นแต่ได้รับความยินยอมจากผู้ขาย เป็นลายลักษณ์อักษร
  </div>

  <div class="section-title">การรับประกันคุณภาพเครื่องและหน้าที่รับผิดชอบในความชำรุดบกพร่อง</div>
  
  <div class="body-text">
    <strong>ข้อ 7.</strong> ผู้ขายรับประกันคุณภาพของเครื่องมือแพทย์ที่ตกลงซื้อขายตามข้อ 1. และรับประกันเครื่องและอะไหล่ภายใน
    ระยะเวลา ${warrantyYears} (${numberToThaiQuantity(warrantyYears)}) ปี
    ของเครื่องมือแพทย์ที่ตกลงซื้อขายดังกล่าว โดยไม่คิดค่าใช้จ่ายใดๆ ทั้งสิ้น เป็นเวลา ${warrantyYears} (${numberToThaiQuantity(warrantyYears)}) ปี นับตั้งแต่วันที่เริ่ดส่ง
    เครื่องมือแพทย์ดังกล่าว ตามลงนามรับเครื่องมือแพทย์ตามข้อ 4.
  </div>
  
  <div class="body-text indent">การรับประกัน Cartridge รายละเอียดการรับประกันคุณภาพของสินค้าดังนี้</div>
  
  ${warrantyDetails.length > 0 ? `
  <table style="width:100%;border-collapse:collapse;margin:10px 0 16px;font-size:13px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:6px 10px;border:1px solid #ccc;width:40px;"></th>
        <th style="padding:6px 10px;border:1px solid #ccc;text-align:left;">รายการ</th>
        <th style="padding:6px 10px;border:1px solid #ccc;text-align:left;">รับประกัน</th>
        <th style="padding:6px 10px;border:1px solid #ccc;text-align:left;">หมายเหตุ</th>
      </tr>
    </thead>
    <tbody>
      ${warrantyRows}
    </tbody>
  </table>` : ""}
  
  <div class="body-text">
    <strong>ข้อ 8.</strong> ภายในระยะเวลารับประกันเครื่องมือแพทย์ที่ตกลงซื้อขายดังกล่าว ต่อไปนี้ หากมีความเสียหายอย่างใดอย่างหนึ่ง
    เกิดขึ้นแก่เครื่องมือแพทย์ ผู้ขายตกลงยินยอมรับประกันความเสียหาย ความชำรุดบกพร่อง หรือเหตุขัดข้องที่เกิดขึ้นกับเครื่องมือ
    แพทย์ที่ตกลงซื้อขายตามข้อ 1. ภายในระยะเวลาไม่เกิน 7 วัน สำหรับความเสียหายเล็กน้อย และโดยเร็วที่สุดสำหรับความเสียหายใหญ่
    ทั้งนี้หากระยะเวลาในการซ่อมแซมเกินกว่า 14 วัน ผู้ขายจะขยายระยะเวลาการรับประกันออกไปตามสิ้นสุดของระยะเวลารอคอยการซ่อมแซม
  </div>
</div>

<!-- PAGE 5 -->
<div class="page">
  ${pageHeader(contractNumber)}

  <div class="body-text indent">
    โดยตกลงยินยอมให้เป็นหน้าที่ของผู้ขาย ที่ต้องทำการซ่อมแก้ หรือหากไม่สามารถซ่อมแก้ได้ให้ทำการเปลี่ยนอะไหล่ให้
    แก่ผู้ซื้อด้วยค่าใช้จ่ายของผู้ขายเองทั้งสิ้น เว้นแต่ค่าความเสียหาย ค่าชำรุดบกพร่อง หรือเหตุขัดข้องอันใดเกิดขึ้นเนื่องจากความผิด
    ของผู้ซื้อเป็นเหตุเช่น หล่น ทำลาย ทำให้เสียหาย หรือเกิดจากการใช้งานไม่ถูกต้องหรือไม่ถูกวิธี หรือไม่เป็นไปตามปกติที่ไป โดยในกรณีนี้ต้องเป็นรับผิดชอบค่าใช้จ่าย
    ในการซ่อมแก้ ค่าเปลี่ยนอะไหล่ ทั้งค่าใช้จ่ายอันใดที่เกิดขึ้นเนื่องจากการซ่อมแก้และเปลี่ยนอะไหล่ดังกล่าว ให้แก่ผู้ขาย ยังเป็น
    หน้าที่ซ่อมแก้ทั้งสิ้น
  </div>

  <div class="body-text">
    <strong>ข้อ 9.</strong> ทั้งนี้การรับประกันข้างต้น ผู้ขายขอสงวนสิทธิ์ไม่รับผิดชอบค่าเสียหาย ไม่รับประกันสินค้าและถือว่าไม่อยู่ในการ
    คุ้มครองการรับประกันคุณภาพสินค้าจากผู้ขาย ซึ่งเกิดจากดังต่อไปนี้
  </div>
  
  <div style="margin-left:40px;line-height:2;">
    <strong>9.1</strong>&nbsp;&nbsp;&nbsp;&nbsp;การกระทำหรือความเสียหายที่ไม่ได้มีสาเหตุจากตัวเครื่อง<br/>
    <strong>9.2</strong>&nbsp;&nbsp;&nbsp;&nbsp;การกระทำที่ไม่ได้เกิดขึ้นจากลักษณะการใช้งานปกติ คือ การใช้งานผิดวิธี<br/>
    <strong>9.3</strong>&nbsp;&nbsp;&nbsp;&nbsp;การดัดแปลงเพื่อใช้กับเครื่องมืออื่นโดยไม่ได้ผ่านความเห็นชอบจากผู้ขาย<br/>
    <strong>9.4</strong>&nbsp;&nbsp;&nbsp;&nbsp;การขนย้ายผิดวิธีหรือการขนย้ายโดยไม่ใช้ช่างผู้ชำนาญการของเครื่องมือแพทย์จากผู้ขาย จนทำให้เครื่องมือแพทย์เสียหาย<br/>
    <strong>9.5</strong>&nbsp;&nbsp;&nbsp;&nbsp;การรับประกันคุณภาพสินค้าและการดูแลบำรุงหลังการขาย ต่อเครื่องมือแพทย์นี้ผู้ขายขอสงวนสิทธิ์เฉพาะ "ผู้ซื้อ" คนแรกเท่านั้น หากมีการซื้อขายต่อหรือมอบสิทธิ์ให้กับบุคคลอื่น ผู้ขายถือว่าสิ้นสุดการรับประกันสินค้าทันที โดยไม่ต้องทำการบอกกล่าวล่วงหน้า
  </div>
  
  <div class="body-text">
    <strong>ข้อ 10.</strong> เกิดเหตุนาภัยแก่เครื่องมือแพทย์ที่ซื้อขาย
  </div>
  <div class="body-text indent">
    ถ้าเครื่องมือแพทย์ที่ซื้อขายถูกโจรภัย อัคคีภัย อุทกภัย สูญหาย ชำรุดบุบสลาย ถูกทำลาย ถูกอายัด ถูกยึด หรือถูกริบได้
    ไม่ว่าโดยเหตุสุดวิสัยหรือโดยเหตุใดๆก็ตาม ในระหว่างที่ยังไม่ได้โอนกรรมสิทธิ์ไปยังผู้ซื้อ
  </div>
</div>

<!-- PAGE 6 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text indent">
    "ผู้ซื้อ" จะต้องเป็นรับผิดฝ่ายเดียว และจำต้องแจ้งให้ "ผู้ขาย" ทราบทันที และ "ผู้ซื้อ" ตกลงจะยอมจ่ายค่าฟ้อง ต้องเอา
    คืนยอมจ่ายซ่อมแก้ ให้คืนสภาพเดิม และยอมชำระเงินค่าซื้อขายสินค้าทั้งสิ้นจนครบ แม้หาก "ผู้ขาย" ได้ออกเงินไปเพื่อการดัง
    กล่าว "ผู้ซื้อ" ยอมจ่ายให้แก่ "ผู้ขาย" ด้วย
  </div>
  
  <div class="body-text">
    <strong>ข้อ 11.</strong> การดัดแปลงเครื่องมือแพทย์ที่ซื้อขาย
  </div>
  <div class="body-text indent">
    ถ้า "ผู้ซื้อ" ทำการดัดแปลงต่อเติมเครื่องมือแพทย์ที่ซื้อขาย โดยไม่ได้รับอนุญาตเป็นหนังสือจาก "ผู้ขาย" เมื่อ "ผู้ขาย"
    เรียกร้อง "ผู้ซื้อ" ยินยอมทำให้เครื่องมือแพทย์นั้นกลับคืนสู่สภาพเดิม และยอมรับผิดในความสูญหาย เสียหาย ชำรุดบุบสลายอัน
    เกิดแก่การนั้น และไม่ว่ากรณีใดๆ "ผู้ซื้อ" ยอมให้สิ่งที่นำเข้ามาดัดแปลงต่อเติดหรือยังอยู่ในเครื่องมือแพทย์ที่ตกลงซื้อขายนี้
    เป็นส่วนหนึ่งของเครื่องมือแพทย์ที่ตกลงซื้อขายและเป็นกรรมสิทธิ์ของ "ผู้ขาย" ด้วย
  </div>

  <div class="body-text">
    <strong>ข้อ 12.</strong> ภายในกำหนดระยะเวลารับประกันตามข้อ 7. ผู้ขายตกลงยินยอมเข้าทำการทดสอบ และตรวจสภาพเครื่องมือ
    แพทย์ที่ซื้อขายและอุปกรณ์ประกอบ ณ สถานที่ส่งมอบและติดตั้งตามที่กำหนดไว้ในข้อ 4. หรือสถานที่อื่นใด (ถ้ามี)
    โดยกำหนดการเข้าทำการทดสอบและตรวจสภาพ ทุกๆ 6 (หก) เดือน ต่อครั้ง โดยนับตั้งแต่วันที่การลงนามรับเครื่องมือแพทย์
    ตามข้อ 4. เป็นต้นไปจนกว่าสิ้นสุดระยะเวลาการรับประกันตามข้อ 7. ด้วยค่าใช้จ่ายของผู้ขายเองทั้งสิ้น นอกจากนี้ผู้ขายจะให้คำแนะนำ
    ในการใช้เครื่องมือแพทย์โดยไม่คิดค่าใช้จ่ายเพิ่มเติม โดยไม่จำกัดระยะเวลา
  </div>
</div>

<!-- PAGE 7 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text indent">
    เมื่อสิ้นสุดระยะเวลารับประกันตามข้อ 7. แล้วหากมีความเสียหายอย่างใดอย่างหนึ่งเกิดขึ้นแก่สินค้าหรือความชำรุดบกพร่อง
    ที่ไม่เห็นประจักษ์เกิดขึ้น หรือเหตุขัดข้องในระบบการทำงานต่างๆ หรือเหตุขัดข้องอันใดจนทำให้ไม่สามารถใช้งานสินค้าได้ตาม
    ปกติ และผู้ซื้อแจ้งความเสียหายให้แก่ผู้ขายทราบ ผู้ขายตกลงยินยอมเข้าทำการทดสอบ และตรวจสภาพเครื่องมือแพทย์ที่ซื้อขาย และ
    อุปกรณ์ประกอบ ให้แก่ผู้ซื้อภายใน 3 (สาม) วันทำการ นับจากวันที่ผู้ขายได้รับแจ้งเป็นลายลักษณ์อักษร และในกรณีนี้ ผู้ซื้อตกลง
    ยินยอมเป็นรับผิดชอบค่าใช้จ่ายต่างๆ ในการทดสอบ และตรวจสภาพ ค่าใช้จ่ายในการซ่อมแก้ ค่าอะไหล่หรือค่าอุปกรณ์ต่างๆ
    ถึงค่าใช้จ่ายอย่างใดๆ ที่จะเกิดขึ้นเนื่องจากการซ่อมแก้ ค่าความเสียหาย ค่าชำรุดบกพร่อง และเหตุขัดข้องอันใด (ถ้ามี) ด้วยตนเองทั้งสิ้น
  </div>

  <div class="body-text">
    <strong>ข้อ 13.</strong> ผู้ซื้อตกลงจะรักษาไว้เป็นความลับและจะไม่เปิดเผยพิมพ์ ประกาศ หรือเผยแพร่ต่อบุคคลที่สาม ซึ่งข้อมูลและข้อ
    กำหนดต่างๆ ในสัญญาฉบับนี้ เว้นแต่จะเป็นการกระทำตามข้อกำหนดของกฎหมาย หรือเมื่อได้รับความยินยอมเป็นลายลักษณ์อักษร
    จากผู้ขาย
  </div>

  <div class="body-text">
    <strong>ข้อ 14.</strong> หากผู้ซื้อผิดนัดผิดสัญญาข้อใดข้อหนึ่งนี้ ถือว่าผู้ซื้อผิดนัดผิดสัญญาทั้งหมด และผู้ซื้อตกลงยินยอมให้ผู้ขายบอก
    เลิกสัญญา และริบเงินมัดจำตามข้อ 2. ได้ทันที โดยไม่ต้องบอกกล่าวล่วงหน้า ในผู้ขายได้ใช้สิทธิ์บอกเลิกสัญญา ผู้ซื้อตกลงยินยอม
    ส่งมอบสินค้าตามข้อ 1. คืนให้แก่ผู้ขาย และให้ผู้ขายใช้สิทธิ์ดำเอาสินค้าคืนไปจากผู้ซื้อหรือบุคคลอื่นๆ (ถ้ามี) ได้ทันที ทั้ง
    ลงยินยอมให้ผู้ซื้อเข้าไปยังสถานที่ส่งมอบและติดตั้งตามข้อ 4. เพื่อกระทำการขนย้ายสินค้าตามข้อ 1. ออกจากสถานที่ดังกล่าวและส่ง
    มอบได้โดยทันที ส่วนเงินที่ได้ชำระค่าซื้อขายเครื่องมือแพทย์ตามข้อ 2. ซึ่งผู้ซื้อได้ชำระให้กับผู้ขายแล้วแต่ยังไม่ครบถ้วนนั้น ผู้ซื้อตกลง
    ยินยอมให้ผู้ขายยึดหนี้เพื่อหักค่าเสื่อมราคาจากการใช้สอยสินค้าตามข้อ 1. ก่อนส่งมอบคืนให้กับผู้ซื้อ
  </div>
</div>

<!-- PAGE 8 -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text">
    <strong>ข้อ 15.</strong> ในกรณีที่ผู้ซื้อได้ชำระเงินให้กับผู้ขายครบถ้วนแล้วแต่ยังไม่ได้ลงนามรับเครื่องมือแพทย์ตามข้อ 4. หากผู้ขาย
    ผิดนัดผิดสัญญาข้อใดข้อหนึ่งนี้ ผู้ขายตกลงยินยอมให้ผู้ซื้อใช้สิทธิ์บอกเลิกสัญญาได้ทันที โดยไม่ต้องบอกกล่าวล่วงหน้า ผู้ขายตกลง
    ยินยอมส่งมอบเงินใดๆที่ผู้ซื้อได้ชำระให้ผู้ขายคืนภายในสองวันทำการ และผู้ขายตกลงยินยอมให้ผู้ซื้อคิดดอกเบี้ยในอัตราร้อยละ 15
    (สิบห้า) ต่อปี ของจำนวนที่ค้างชำระคืนให้แก่ผู้ซื้อจนกว่าผู้ซื้อจะได้รับเงินคืนครบถ้วน
  </div>
  
  <div class="body-text indent">
    ในกรณีที่ผู้ซื้อได้ชำระให้กับผู้ขายครบถ้วนและได้ลงนามรับเครื่องมือแพทย์ตามข้อ 4. หากผู้ขายผิดนัดผิดสัญญาข้อใดข้อหนึ่งนี้ ผู้ขายตกลงยินยอมให้ผู้ซื้อใช้สิทธิ์บอกเลิกสัญญาได้ทันที โดยไม่ต้องบอกกล่าวล่วงหน้า ทั้งนี้ผู้ซื้อมีสิทธิ์เรียกร้องค่าเสียหาย
    ใดๆอันเกิดจากความผิดของผู้ขาย ทั้งดอกเบี้ยในอัตราร้อยละ 15 (สิบห้า) ต่อปี ของจำนวนค่าเสียหายที่ค้างชำระคืนให้แก่ผู้ซื้อ
    จนกว่าผู้ซื้อจะได้รับเงินคืนครบถ้วน
  </div>
</div>

<!-- PAGE 9: Remarks & Signatures -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text" style="font-size:13px;color:#555;">
    <strong>หมายเหตุ :</strong> ในกรณีที่มีการเปลี่ยนแปลงแก้ไขใดใดคู่สัญญาจะจัดทำเอกสารแนบท้ายเพิ่มเติม และให้ยึดถือข้อตกลงตามเอกสารแนบท้ายสัญญาเป็นหลัก และในกรณีที่มีความขัดแย้งระหว่างข้อสัญญาตามสัญญาซื้อขายเครื่องมือแพทย์กับเอกสารแนบท้ายสัญญาเป็นหลัก
  </div>
  
  <div class="body-text" style="margin-top:16px;">
    สัญญานี้ทำขึ้นเป็นสองฉบับ ข้อความถูกต้องตรงกันทุกประการ และต่างฝ่ายต่างเก็บไว้ฝ่ายละฉบับ
    คู่สัญญาได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้วเห็นว่าถูกต้องตรงกับความประสงค์ของตนเพื่อเป็นหลักฐานจึงได้ลงลายมือชื่อพร้อมประทับ
    ตรา (ถ้ามี) ไว้เป็นสำคัญต่อหน้าพยาน ดังข้างท้ายนี้
  </div>

  <div class="sig-section">
    <div class="sig-row">
      <div class="sig-box">
        ${contract.seller_signature ? `<img src="${contract.seller_signature}" style="height:60px;margin-bottom:4px;" />` : ""}
        <div class="sig-line">ลงชื่อ.....................................................ผู้ขาย</div>
        <div style="margin-top:6px;">(${sellerRep})</div>
        <div style="font-size:13px;color:#555;">${SELLER.company_th}</div>
      </div>
      <div class="sig-box">
        ${contract.buyer_signature ? `<img src="${contract.buyer_signature}" style="height:60px;margin-bottom:4px;" />` : ""}
        <div class="sig-line">ลงชื่อ.......................................................ผู้ซื้อ</div>
        <div style="margin-top:6px;">(${buyerRep})</div>
      </div>
    </div>
    
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-line">ลงชื่อ...............................................ผู้จัดการฝ่ายขาย</div>
        <div style="margin-top:6px;">(${contract.witness_name || ""})</div>
        <div style="font-size:13px;color:#555;">${SELLER.company_th}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">ลงชื่อ.....................................................พยาน</div>
      </div>
    </div>
  </div>
  
</div>

<!-- PAGE 10: Appendix -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <h2 style="margin-bottom:24px;">เอกสารแนบท้ายสัญญา</h2>
  
  <div class="body-text">
    <strong>ข้อ1.</strong> อ้างถึงสัญญาซื้อขายเลขที่ <strong>${contractNumber}</strong> ลงวันที่ <strong>${fmtDateThai(contractDate)}</strong> ตามที่ ${SELLER.company_th}
    และ <strong>${buyerRep}</strong> (ผู้ซื้อ) ตกลงซื้อขายเครื่องมือแพทย์ รุ่น <strong>${productName}</strong> ยี่ห้อ <strong>${productBrand}</strong>
    จำนวน ${productQuantity} (${numberToThaiQuantity(productQuantity)}) เป็นเงิน <strong>${fmtInt(totalPrice)} บาท (${numberToThaiText(totalPrice)})</strong> ราคารวมภาษีมูลค่าเพิ่มแล้ว
  </div>
  
  <div class="body-text">
    ดังนั้น เพื่อประโยชน์กับทาง <strong>${buyerRep}</strong> (ผู้ซื้อ) ทาง <strong>${SELLER.company_th}</strong> มีความยินดีที่จะมอบ
  </div>
  
  ${appendixHTML}
  
  <div class="body-text" style="margin-top:20px;">
    <strong>ข้อ2.</strong> เอกสารแนบท้ายสัญญาเพิ่มเติมดังต่อไปนี้ให้ถือเป็นส่วนหนึ่งของสัญญาฉบับนี้
  </div>
  
  <div style="margin-left:40px;line-height:2;font-size:14px;">
    <div><strong>2.1</strong>&nbsp;&nbsp;&nbsp;&nbsp;กรณีที่ผู้ซื้อประกอบอาชีพแพทย์</div>
    <div style="margin-left:40px;">2.1.1 สำเนาบัตรประชาชนผู้ซื้อ พร้อมรับรองสำเนาถูกต้อง</div>
    <div style="margin-left:40px;">2.1.2 สำเนาใบประกอบวิชาชีพผู้ซื้อ พร้อมรับรองสำเนาถูกต้อง</div>
    <div style="margin-left:40px;">2.1.3 หนังสือรับรองบริษัท (กรณีซื้อในนามนิติบุคคล) พร้อมรับรองสำเนาถูกต้อง</div>
    <div style="margin-top:8px;"><strong>2.2</strong>&nbsp;&nbsp;&nbsp;&nbsp;กรณีที่ผู้ซื้อไม่ได้ประกอบอาชีพแพทย์</div>
    <div style="margin-left:40px;">2.2.1 สำเนาบัตรประชาชนผู้ซื้อ พร้อมรับรองสำเนาถูกต้อง</div>
    <div style="margin-left:40px;">2.2.2 สำเนาใบ สพ.7 พร้อมรับรองสำเนาถูกต้อง</div>
    <div style="margin-left:40px;">2.2.3 หนังสือรับรองบริษัท (กรณีซื้อในนามนิติบุคคล) พร้อมรับรองสำเนาถูกต้อง</div>
  </div>
</div>

<!-- PAGE 11: Appendix signatures -->
<div class="page">
  ${pageHeader(contractNumber)}
  
  <div class="body-text">
    เอกสารแนบท้ายสัญญานี้ทำขึ้นเป็นสองฉบับ ข้อความถูกต้องตรงกันทุกประการ และต่างฝ่ายต่างเก็บไว้ฝ่ายละฉบับ
    คู่สัญญาได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้วเห็นว่าถูกต้องตรงกับความประสงค์ของตนเพื่อเป็นหลักฐานจึงได้ลงลายมือชื่อ
    พร้อมประทับตรา (ถ้ามี) ไว้เป็นสำคัญต่อหน้าพยาน ดังข้างท้ายนี้
  </div>

  <div class="sig-section">
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-line">ลงชื่อ.....................................................ผู้ขาย</div>
        <div style="margin-top:6px;">(${sellerRep})</div>
        <div style="font-size:13px;color:#555;">${SELLER.company_th}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line">ลงชื่อ.......................................................ผู้ซื้อ</div>
        <div style="margin-top:6px;">(${buyerRep})</div>
      </div>
    </div>
  </div>

  ${contract.additional_notes ? `
  <div style="margin-top:40px;">
    <div class="section-title">หมายเหตุเพิ่มเติม</div>
    <div class="body-text">${contract.additional_notes}</div>
  </div>` : ""}
</div>

</body>
</html>`;
}

function numberToThaiQuantity(n: number): string {
  const units = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
  const tens = ["", "สิบ", "ยี่สิบ", "สามสิบ", "สี่สิบ", "ห้าสิบ", "หกสิบ"];
  if (n <= 10) return units[n];
  if (n < 20) return "สิบ" + (n === 11 ? "เอ็ด" : units[n - 10]);
  if (n < 70) return tens[Math.floor(n / 10)] + (n % 10 === 1 ? "เอ็ด" : units[n % 10]);
  if (n === 60) return "หกสิบ";
  return n.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contract_id } = await req.json();

    if (!contract_id) {
      return new Response(
        JSON.stringify({ error: "contract_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: contract, error: contractErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .single();

    if (contractErr || !contract) {
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let account = null;
    if (contract.account_id) {
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", contract.account_id)
        .single();
      account = data;
    }

    let contacts: any[] = [];
    if (contract.account_id) {
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("account_id", contract.account_id)
        .eq("is_decision_maker", true)
        .limit(1);
      contacts = data || [];
    }

    const html = generateHTML(contract, account, contacts);

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

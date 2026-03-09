import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SELLER = {
  company: "Optima Aesthetic Co.,Ltd. (สำนักงานใหญ่)",
  logo: "https://szrjikvwdygyyxfztfvn.supabase.co/storage/v1/object/public/company-assets/optima-logo.png",
};

function fmtDate(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderSigningPage(qt: any, account: any): string {
  const price = qt.price || 0;
  const contactName = account?.clinic_name || "-";

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>เซ็นใบเสนอราคา ${qt.qt_number || ""}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; background: #f5f5f5; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; margin-bottom: 20px; }
  .card-header { background: linear-gradient(135deg, #e67e22, #f39c12); padding: 24px; color: white; text-align: center; }
  .card-header img { height: 50px; margin-bottom: 12px; }
  .card-header h1 { font-size: 22px; font-weight: 700; }
  .card-header p { font-size: 14px; opacity: 0.9; margin-top: 4px; }
  .card-body { padding: 24px; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #888; }
  .info-value { font-weight: 600; color: #333; }
  .total-row { font-size: 18px; color: #e67e22; font-weight: 700; }
  .sign-section { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 24px; }
  .sign-section h2 { font-size: 18px; font-weight: 700; color: #333; margin-bottom: 16px; text-align: center; }
  .canvas-wrapper { border: 2px dashed #ddd; border-radius: 8px; overflow: hidden; background: #fafafa; margin-bottom: 12px; }
  canvas { width: 100%; cursor: crosshair; touch-action: none; display: block; }
  .clear-btn { text-align: right; margin-bottom: 16px; }
  .clear-btn button { background: none; border: none; color: #888; font-size: 13px; cursor: pointer; font-family: 'Sarabun', sans-serif; }
  .name-input { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; font-family: 'Sarabun', sans-serif; margin-bottom: 16px; }
  .name-input:focus { outline: none; border-color: #e67e22; }
  .submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Sarabun', sans-serif; }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .submit-btn:hover:not(:disabled) { filter: brightness(1.05); }
  .success-msg { text-align: center; padding: 40px 20px; }
  .success-msg .icon { font-size: 60px; margin-bottom: 16px; }
  .success-msg h2 { color: #27ae60; font-size: 22px; margin-bottom: 8px; }
  .success-msg p { color: #888; font-size: 14px; }
  .approved-sig { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
  .approved-sig img { height: 50px; margin-bottom: 4px; }
  .approved-sig .name { font-size: 13px; font-weight: 600; }
  .approved-sig .pos { font-size: 12px; color: #888; }
  .already-signed { text-align: center; padding: 40px 20px; }
  .already-signed .icon { font-size: 60px; margin-bottom: 16px; }
  .already-signed h2 { color: #3498db; font-size: 20px; margin-bottom: 8px; }
  #loading { display: none; text-align: center; padding: 20px; }
  .spinner { display: inline-block; width: 32px; height: 32px; border: 3px solid #ddd; border-top-color: #e67e22; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="card-header">
      <img src="${SELLER.logo}" alt="Optima" />
      <h1>ใบเสนอราคา</h1>
      <p>${qt.qt_number || "-"}</p>
    </div>
    <div class="card-body">
      <div class="info-row"><span class="info-label">ลูกค้า</span><span class="info-value">${contactName}</span></div>
      <div class="info-row"><span class="info-label">สินค้า</span><span class="info-value">${qt.product || "-"}</span></div>
      <div class="info-row"><span class="info-label">วันที่</span><span class="info-value">${fmtDate(qt.qt_date)}</span></div>
      <div class="info-row total-row"><span>ราคารวม</span><span>฿${fmt(price)}</span></div>
      ${qt.approved_signature ? `
      <div class="approved-sig">
        <div style="font-size:12px;color:#888;margin-bottom:4px;">อนุมัติโดย</div>
        <img src="${qt.approved_signature}" alt="signature" />
        <div class="name">${qt.approved_name || ""}</div>
        <div class="pos">${qt.approved_position || ""} — ${fmtDate(qt.approved_at)}</div>
      </div>` : ""}
    </div>
  </div>

  ${qt.customer_signature ? `
  <div class="card">
    <div class="card-body already-signed">
      <div class="icon">✅</div>
      <h2>เซ็นเรียบร้อยแล้ว</h2>
      <p>โดย ${qt.customer_signer_name || "-"} เมื่อ ${fmtDate(qt.customer_signed_at)}</p>
    </div>
  </div>
  ` : `
  <div class="sign-section" id="sign-section">
    <h2>✍️ ลงนามรับทราบ</h2>
    <div class="canvas-wrapper">
      <canvas id="sigCanvas" width="560" height="200"></canvas>
    </div>
    <div class="clear-btn"><button onclick="clearSig()">ล้างลายเซ็น</button></div>
    <input type="text" id="signerName" class="name-input" placeholder="ชื่อ-นามสกุลผู้เซ็น" />
    <button class="submit-btn" id="submitBtn" onclick="submitSignature()" disabled>ยืนยันลงนาม</button>
  </div>
  <div id="loading"><div class="spinner"></div><p style="margin-top:8px;color:#888;">กำลังบันทึก...</p></div>
  <div id="success" style="display:none;" class="card"><div class="card-body success-msg">
    <div class="icon">🎉</div>
    <h2>ลงนามสำเร็จ!</h2>
    <p>ขอบคุณที่ยืนยันใบเสนอราคา<br/>ทีมงานจะดำเนินการต่อให้ค่ะ</p>
  </div></div>
  `}
</div>

${!qt.customer_signature ? `
<script>
const canvas = document.getElementById('sigCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let hasSig = false;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = '#1a1a1a';
ctx.lineWidth = 2.5;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const t = e.touches ? e.touches[0] : e;
  return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
}

canvas.addEventListener('mousedown', e => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
canvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
canvas.addEventListener('mouseup', () => { drawing = false; hasSig = true; checkReady(); });
canvas.addEventListener('mouseleave', () => { drawing = false; });
canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
canvas.addEventListener('touchend', () => { drawing = false; hasSig = true; checkReady(); });

function clearSig() {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  hasSig = false;
  checkReady();
}

function checkReady() {
  const name = document.getElementById('signerName').value.trim();
  document.getElementById('submitBtn').disabled = !hasSig || !name;
}

document.getElementById('signerName').addEventListener('input', checkReady);

async function submitSignature() {
  const name = document.getElementById('signerName').value.trim();
  if (!hasSig || !name) return;
  
  document.getElementById('sign-section').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  
  const sigData = canvas.toDataURL('image/png');
  
  try {
    const res = await fetch(window.location.href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotation_id: '${qt.id}',
        signature: sigData,
        signer_name: name
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('success').style.display = 'block';
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('sign-section').style.display = 'block';
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}
</script>
` : ""}
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const quotationId = url.searchParams.get("id");

  // GET: Show signing page
  if (req.method === "GET" && quotationId) {
    const { data: qt, error } = await supabase
      .from("quotations")
      .select("*, accounts!quotations_account_id_fkey(clinic_name, company_name, address)")
      .eq("id", quotationId)
      .single();

    if (error || !qt) {
      return new Response("<h1>ไม่พบใบเสนอราคา</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (qt.approval_status !== "APPROVED") {
      return new Response("<h1>ใบเสนอราคานี้ยังไม่ได้รับการอนุมัติ</h1>", {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const html = renderSigningPage(qt, qt.accounts);
    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // POST: Save customer signature
  if (req.method === "POST") {
    try {
      let body: any;
      const contentType = req.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else {
        // May come from the form with query param
        const qId = url.searchParams.get("id");
        body = await req.json();
        if (!body.quotation_id && qId) body.quotation_id = qId;
      }

      const { quotation_id, signature, signer_name } = body;

      if (!quotation_id || !signature || !signer_name) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update quotation with customer signature
      const { error: updateErr } = await supabase
        .from("quotations")
        .update({
          customer_signature: signature,
          customer_signed_at: new Date().toISOString(),
          customer_signer_name: signer_name,
        })
        .eq("id", quotation_id)
        .eq("approval_status", "APPROVED");

      if (updateErr) {
        return new Response(
          JSON.stringify({ success: false, error: updateErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Not Found", { status: 404 });
});

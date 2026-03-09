import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const htmlHeaders = new Headers(corsHeaders);
htmlHeaders.set("content-type", "text/html; charset=utf-8");
// NOTE: Some gateways may append a restrictive CSP; we still set a permissive one for inline CSS/JS on this page.
htmlHeaders.set(
  "content-security-policy",
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; img-src * data:; font-src * data:; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval';"
);

const jsonHeaders = new Headers(corsHeaders);
jsonHeaders.set("content-type", "application/json; charset=utf-8");

const SUPABASE_URL = "https://szrjikvwdygyyxfztfvn.supabase.co";

const SELLER = {
  company: "Optima Aesthetic Co.,Ltd. (สำนักงานใหญ่)",
  logo: `${SUPABASE_URL}/storage/v1/object/public/company-assets/optima-logo.png`,
};

function fmtDate(d: string | null): string {
  if (!d) return "-";
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function resolveQuotationPdfUrl(qt_attachment: string | null): string | null {
  if (!qt_attachment) return null;
  if (qt_attachment.startsWith("http://") || qt_attachment.startsWith("https://")) return qt_attachment;
  return `${SUPABASE_URL}/storage/v1/object/public/quotation-files/${qt_attachment}`;
}

function renderSigningPage(qt: any, account: any): string {
  const price = qt.price || 0;
  const contactName = account?.clinic_name || "-";
  const alreadySigned = !!qt.customer_signature;

  // URL for viewing the approved PDF from storage
  const pdfUrl = resolveQuotationPdfUrl(qt.qt_attachment ?? null);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ใบเสนอราคา ${qt.qt_number || ""} — Optima Aesthetic</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; background: #f8f9fa; color: #333; min-height: 100vh; }

  /* Top bar */
  .topbar { background: white; border-bottom: 1px solid #eee; padding: 12px 20px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
  .topbar img { height: 36px; }
  .topbar span { font-weight: 600; font-size: 15px; color: #e67e22; }

  .container { max-width: 560px; margin: 0 auto; padding: 24px 16px 60px; }

  /* Quotation info card */
  .qt-card { background: white; border-radius: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); overflow: hidden; margin-bottom: 20px; }
  .qt-header { background: linear-gradient(135deg, #e67e22, #f5a623); padding: 28px 24px; color: white; text-align: center; }
  .qt-header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .qt-header .qt-num { font-size: 14px; opacity: 0.9; }
  .qt-body { padding: 20px 24px; }
  .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f3f3; font-size: 14px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #888; }
  .info-value { font-weight: 600; text-align: right; max-width: 60%; }
  .total-row { font-size: 18px; color: #e67e22; font-weight: 700; padding: 14px 0; }

  /* Approved sig preview */
  .approved-box { background: #fdf8f3; border: 1px solid #f5dcc3; border-radius: 10px; padding: 16px; margin-top: 12px; text-align: center; }
  .approved-box .label { font-size: 12px; color: #b07830; margin-bottom: 6px; }
  .approved-box img { height: 50px; margin-bottom: 4px; }
  .approved-box .name { font-size: 13px; font-weight: 600; }
  .approved-box .pos { font-size: 12px; color: #888; }

  /* Action buttons */
  .actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  .btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Sarabun', sans-serif; transition: all 0.15s; }
  .btn-view { background: white; color: #e67e22; border: 2px solid #e67e22; }
  .btn-view:hover { background: #fef6ee; }
  .btn-confirm { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; font-size: 16px; }
  .btn-confirm:hover { filter: brightness(1.05); }
  .btn-download { background: linear-gradient(135deg, #3498db, #2980b9); color: white; }
  .btn-download:hover { filter: brightness(1.05); }

  /* Already signed state */
  .signed-card { background: white; border-radius: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); padding: 32px 24px; text-align: center; margin-bottom: 20px; }
  .signed-card .icon { font-size: 56px; margin-bottom: 12px; }
  .signed-card h2 { color: #27ae60; font-size: 20px; margin-bottom: 6px; }
  .signed-card p { color: #888; font-size: 13px; }

  /* Modal overlay */
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center; padding: 16px; }
  .modal-overlay.active { display: flex; }
  .modal { background: white; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #eee; }
  .modal-header h3 { font-size: 17px; font-weight: 700; }
  .modal-close { background: none; border: none; font-size: 22px; cursor: pointer; color: #888; padding: 4px; }
  .modal-body { padding: 20px; }

  .form-group { margin-bottom: 14px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; }
  .form-group input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; font-family: 'Sarabun', sans-serif; }
  .form-group input:focus { outline: none; border-color: #e67e22; box-shadow: 0 0 0 3px rgba(230,126,34,0.12); }

  .canvas-wrapper { border: 2px dashed #ddd; border-radius: 10px; overflow: hidden; background: #fafafa; margin-bottom: 8px; }
  canvas { width: 100%; cursor: crosshair; touch-action: none; display: block; }
  .clear-link { text-align: right; }
  .clear-link button { background: none; border: none; color: #888; font-size: 12px; cursor: pointer; font-family: 'Sarabun', sans-serif; text-decoration: underline; }

  .modal-footer { padding: 16px 20px; border-top: 1px solid #eee; }
  .btn-submit { width: 100%; padding: 13px; background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: 'Sarabun', sans-serif; }
  .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Loading */
  #loading-overlay { display: none; position: fixed; inset: 0; background: rgba(255,255,255,0.85); z-index: 200; align-items: center; justify-content: center; flex-direction: column; gap: 12px; }
  #loading-overlay.active { display: flex; }
  .spinner { width: 36px; height: 36px; border: 3px solid #eee; border-top-color: #e67e22; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Success modal */
  .success-content { text-align: center; padding: 24px 20px; }
  .success-content .icon { font-size: 56px; margin-bottom: 12px; }
  .success-content h2 { color: #27ae60; font-size: 20px; margin-bottom: 6px; }
  .success-content p { color: #888; font-size: 13px; margin-bottom: 20px; }
</style>
</head>
<body>

<!-- Top bar -->
<div class="topbar">
  <img src="${SELLER.logo}" alt="Optima" />
  <span>Optima Aesthetic</span>
</div>

<div class="container">
  <!-- Quotation info -->
  <div class="qt-card">
    <div class="qt-header">
      <h1>ใบเสนอราคา</h1>
      <div class="qt-num">${qt.qt_number || "-"}</div>
    </div>
    <div class="qt-body">
      <div class="info-row"><span class="info-label">ลูกค้า</span><span class="info-value">${contactName}</span></div>
      <div class="info-row"><span class="info-label">สินค้า</span><span class="info-value">${qt.product || "-"}</span></div>
      <div class="info-row"><span class="info-label">วันที่เสนอราคา</span><span class="info-value">${fmtDate(qt.qt_date)}</span></div>
      <div class="info-row total-row"><span>ราคารวมทั้งสิ้น</span><span>฿${fmt(price)}</span></div>
      ${qt.approved_signature ? `
      <div class="approved-box">
        <div class="label">อนุมัติโดย Optima Aesthetic</div>
        <img src="${qt.approved_signature}" alt="approved signature" />
        <div class="name">${qt.approved_name || ""}</div>
        <div class="pos">${qt.approved_position || ""} — ${fmtDate(qt.approved_at)}</div>
      </div>` : ""}
    </div>
  </div>

  ${alreadySigned ? `
  <!-- Already signed -->
  <div class="signed-card">
    <div class="icon">✅</div>
    <h2>ลงนามเรียบร้อยแล้ว</h2>
    <p>โดย ${qt.customer_signer_name || "-"} เมื่อ ${fmtDate(qt.customer_signed_at)}</p>
  </div>
  <div class="actions">
    ${pdfUrl ? `<button class="btn btn-download" onclick="window.open('${pdfUrl}','_blank')">📥 ดาวน์โหลดใบเสนอราคา (PDF)</button>` : ""}
  </div>
  ` : `
  <!-- Actions -->
  <div class="actions">
    ${pdfUrl ? `<button class="btn btn-view" onclick="window.open('${pdfUrl}','_blank')">📄 ดูใบเสนอราคา (PDF)</button>` : ""}
    <button class="btn btn-confirm" onclick="openSignModal()">✍️ ยืนยันและลงนามใบเสนอราคา</button>
  </div>
  `}
</div>

<!-- Sign Modal -->
<div class="modal-overlay" id="signModal">
  <div class="modal">
    <div class="modal-header">
      <h3>✍️ ลงนามยืนยันใบเสนอราคา</h3>
      <button class="modal-close" onclick="closeSignModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>ชื่อ-นามสกุล ผู้ลงนาม</label>
        <input type="text" id="signerName" placeholder="เช่น นพ.สมชาย รักสุข" oninput="checkReady()" />
      </div>
      <div class="form-group">
        <label>ตำแหน่ง</label>
        <input type="text" id="signerPosition" placeholder="เช่น ผู้อำนวยการคลินิก" oninput="checkReady()" />
      </div>
      <div class="form-group">
        <label>ลายเซ็น</label>
        <div class="canvas-wrapper">
          <canvas id="sigCanvas" width="440" height="160"></canvas>
        </div>
        <div class="clear-link"><button onclick="clearSig()">ล้างลายเซ็น</button></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-submit" id="submitBtn" onclick="submitSignature()" disabled>ยืนยันลงนาม</button>
    </div>
  </div>
</div>

<!-- Success Modal -->
<div class="modal-overlay" id="successModal">
  <div class="modal">
    <div class="success-content">
      <div class="icon">🎉</div>
      <h2>ลงนามสำเร็จ!</h2>
      <p>ขอบคุณที่ยืนยันใบเสนอราคา<br/>ทีมงานจะดำเนินการต่อให้ค่ะ</p>
      <div class="actions">
        <button class="btn btn-download" id="downloadBtn" style="display:none;" onclick="downloadPdf()">📥 ดาวน์โหลดใบเสนอราคา (PDF)</button>
        <button class="btn btn-view" onclick="location.reload()" style="margin-top:8px;">กลับหน้าหลัก</button>
      </div>
    </div>
  </div>
</div>

<!-- Loading -->
<div id="loading-overlay">
  <div class="spinner"></div>
  <div style="font-size:14px;color:#888;">กำลังบันทึกลายเซ็น...</div>
</div>

${!alreadySigned ? `
<script>
let canvas, ctx, drawing = false, hasSig = false;

function initCanvas() {
  canvas = document.getElementById('sigCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
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
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, { passive: false });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, { passive: false });
  canvas.addEventListener('touchend', () => { drawing = false; hasSig = true; checkReady(); });
}

function openSignModal() {
  document.getElementById('signModal').classList.add('active');
  setTimeout(initCanvas, 100);
}

function closeSignModal() {
  document.getElementById('signModal').classList.remove('active');
}

function clearSig() {
  if (!ctx) return;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  hasSig = false;
  checkReady();
}

function checkReady() {
  const name = document.getElementById('signerName').value.trim();
  const position = document.getElementById('signerPosition').value.trim();
  document.getElementById('submitBtn').disabled = !hasSig || !name || !position;
}

async function submitSignature() {
  const name = document.getElementById('signerName').value.trim();
  const position = document.getElementById('signerPosition').value.trim();
  if (!hasSig || !name || !position) return;

  document.getElementById('signModal').classList.remove('active');
  document.getElementById('loading-overlay').classList.add('active');

  const sigData = canvas.toDataURL('image/png');

  try {
    const res = await fetch(window.location.href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quotation_id: '${qt.id}',
        signature: sigData,
        signer_name: name,
        signer_position: position
      })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('loading-overlay').classList.remove('active');
      document.getElementById('successModal').classList.add('active');
      // Show download button if PDF URL available
      if (result.pdf_url) {
        const dlBtn = document.getElementById('downloadBtn');
        dlBtn.style.display = 'flex';
        dlBtn.setAttribute('data-url', result.pdf_url);
      }
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (err) {
    document.getElementById('loading-overlay').classList.remove('active');
    document.getElementById('signModal').classList.add('active');
    alert('เกิดข้อผิดพลาด: ' + err.message);
  }
}

function downloadPdf() {
  const url = document.getElementById('downloadBtn').getAttribute('data-url');
  if (url) window.open(url, '_blank');
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
        headers: htmlHeaders,
      });
    }

    if (qt.approval_status !== "APPROVED" && qt.approval_status !== "CUSTOMER_SIGNED") {
      return new Response("<h1>ใบเสนอราคานี้ยังไม่ได้รับการอนุมัติ</h1>", {
        status: 400,
        headers: htmlHeaders,
      });
    }

    const html = renderSigningPage(qt, qt.accounts);
    return new Response(html, {
      headers: htmlHeaders,
    });
  }

  // POST: Save customer signature
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { quotation_id, signature, signer_name, signer_position } = body;

      if (!quotation_id || !signature || !signer_name) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Update quotation with customer signature
      const { error: updateErr } = await supabase
        .from("quotations")
        .update({
          customer_signature: signature,
          customer_signed_at: new Date().toISOString(),
          customer_signer_name: signer_name,
          approval_status: "CUSTOMER_SIGNED",
        })
        .eq("id", quotation_id)
        .eq("approval_status", "APPROVED");

      if (updateErr) {
        return new Response(
          JSON.stringify({ success: false, error: updateErr.message }),
          { status: 500, headers: jsonHeaders }
        );
      }

      // Get the updated quotation to return the PDF URL and account_id
      const { data: qt } = await supabase
        .from("quotations")
        .select("qt_attachment, account_id, price, payment_condition")
        .eq("id", quotation_id)
        .single();

      // Auto-create default payment installment if none exists
      if (qt) {
        const { data: existing } = await supabase
          .from("payment_installments")
          .select("id")
          .eq("quotation_id", quotation_id)
          .limit(1);

        if (!existing || existing.length === 0) {
          const totalPrice = qt.price || 0;
          const condition = qt.payment_condition || "CASH";

          if (condition === "INSTALLMENT") {
            // Create 3 installments: 50%, 25%, 25%
            const splits = [0.5, 0.25, 0.25];
            for (let i = 0; i < splits.length; i++) {
              const dueDate = new Date();
              dueDate.setDate(dueDate.getDate() + (i * 30));
              await supabase.from("payment_installments").insert({
                quotation_id,
                installment_number: i + 1,
                amount: Math.round(totalPrice * splits[i]),
                due_date: dueDate.toISOString().split("T")[0],
              });
            }
          } else {
            // CASH or LEASING: single installment
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
            await supabase.from("payment_installments").insert({
              quotation_id,
              installment_number: 1,
              amount: totalPrice,
              due_date: dueDate.toISOString().split("T")[0],
            });
          }
        }
      }

      // Auto-advance opportunities for this account to NEGOTIATION
      if (qt?.account_id) {
        const { data: opps } = await supabase
          .from("opportunities")
          .select("id, stage")
          .eq("account_id", qt.account_id)
          .not("stage", "in", '("NEGOTIATION","CLOSED_WON","CLOSED_LOST")');

        if (opps && opps.length > 0) {
          for (const opp of opps) {
            await supabase
              .from("opportunities")
              .update({ stage: "NEGOTIATION" })
              .eq("id", opp.id);

            await supabase
              .from("opportunity_stage_history")
              .insert({
                opportunity_id: opp.id,
                from_stage: opp.stage,
                to_stage: "NEGOTIATION",
                changed_by: "CUSTOMER_SIGNED",
              });
          }
        }
      }

      const pdfUrl = resolveQuotationPdfUrl(qt?.qt_attachment ?? null);

      return new Response(JSON.stringify({ success: true, pdf_url: pdfUrl }), {
        headers: jsonHeaders,
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }
  }

  return new Response("Not Found", { status: 404 });
});

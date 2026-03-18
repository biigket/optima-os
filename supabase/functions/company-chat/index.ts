import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function gatherContext(supabase: any, userMessage: string) {
  const msg = userMessage.toLowerCase();
  const context: string[] = [];

  // Always fetch summary counts
  const [
    { count: accountCount },
    { count: oppCount },
    { count: demoCount },
    { count: quotationCount },
    { count: installCount },
    { count: ticketCount },
  ] = await Promise.all([
    supabase.from("accounts").select("*", { count: "exact", head: true }),
    supabase.from("opportunities").select("*", { count: "exact", head: true }),
    supabase.from("demos").select("*", { count: "exact", head: true }),
    supabase.from("quotations").select("*", { count: "exact", head: true }),
    supabase.from("installations").select("*", { count: "exact", head: true }),
    supabase.from("service_tickets").select("*", { count: "exact", head: true }),
  ]);

  context.push(`ภาพรวมระบบ: ลูกค้า ${accountCount} ราย, โอกาสขาย ${oppCount} รายการ, เดโม ${demoCount} ครั้ง, ใบเสนอราคา ${quotationCount} ใบ, เครื่องติดตั้ง ${installCount} เครื่อง, ใบแจ้งซ่อม ${ticketCount} ใบ`);

  // Stock queries
  if (msg.includes("สต็อก") || msg.includes("stock") || msg.includes("คลัง") || msg.includes("สินค้า") || msg.includes("เครื่อง") || msg.includes("พร้อมขาย") || msg.includes("qc") || msg.includes("หัว") || msg.includes("cartridge") || msg.includes("คาร์ทริดจ์") || msg.includes("ติดจอง")) {
    const { data: stockItems } = await supabase
      .from("qc_stock_items")
      .select("product_type, status, cartridge_type")
      .limit(2000);

    if (stockItems?.length) {
      // Summary by product_type
      const summary: Record<string, Record<string, number>> = {};
      for (const item of stockItems) {
        if (!summary[item.product_type]) summary[item.product_type] = {};
        summary[item.product_type][item.status || "ไม่ระบุ"] = (summary[item.product_type][item.status || "ไม่ระบุ"] || 0) + 1;
      }
      let stockText = "สต็อกสินค้า:\n";
      for (const [type, statuses] of Object.entries(summary)) {
        const total = Object.values(statuses).reduce((a, b) => a + b, 0);
        const details = Object.entries(statuses).map(([s, c]) => `${s}: ${c}`).join(", ");
        stockText += `- ${type} (รวม ${total}): ${details}\n`;
      }

      // Cartridge breakdown by cartridge_type
      const cartridgeItems = stockItems.filter((i: any) => i.product_type === 'CARTRIDGE');
      if (cartridgeItems.length > 0) {
        const byType: Record<string, Record<string, number>> = {};
        for (const item of cartridgeItems) {
          const ct = item.cartridge_type || 'ไม่ระบุ';
          if (!byType[ct]) byType[ct] = {};
          byType[ct][item.status || 'ไม่ระบุ'] = (byType[ct][item.status || 'ไม่ระบุ'] || 0) + 1;
        }
        stockText += "\nCartridge แยกตามชนิด:\n";
        for (const [ct, statuses] of Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0]))) {
          const details = Object.entries(statuses).map(([s, c]) => `${s}: ${c}`).join(", ");
          stockText += `- ${ct}: ${details}\n`;
        }
      }

      context.push(stockText);
    }
  }

  // Opportunities / pipeline
  if (msg.includes("โอกาส") || msg.includes("pipeline") || msg.includes("ขาย") || msg.includes("ดีล") || msg.includes("stage")) {
    const { data: opps } = await supabase
      .from("opportunities")
      .select("stage, expected_value, interested_products, assigned_sale")
      .limit(500);

    if (opps?.length) {
      const byStage: Record<string, { count: number; value: number }> = {};
      for (const o of opps) {
        if (!byStage[o.stage]) byStage[o.stage] = { count: 0, value: 0 };
        byStage[o.stage].count++;
        byStage[o.stage].value += Number(o.expected_value || 0);
      }
      let oppText = "Pipeline โอกาสขาย:\n";
      for (const [stage, info] of Object.entries(byStage)) {
        oppText += `- ${stage}: ${info.count} รายการ, มูลค่ารวม ฿${info.value.toLocaleString()}\n`;
      }
      context.push(oppText);
    }
  }

  // Demos
  if (msg.includes("เดโม") || msg.includes("demo") || msg.includes("สาธิต")) {
    const { data: demos } = await supabase
      .from("demos")
      .select("demo_date, confirmed, products_demo, report_submitted")
      .order("demo_date", { ascending: false })
      .limit(20);

    if (demos?.length) {
      const pending = demos.filter((d: any) => !d.confirmed).length;
      const confirmed = demos.filter((d: any) => d.confirmed).length;
      context.push(`เดโมล่าสุด 20 รายการ: ยืนยันแล้ว ${confirmed}, รอยืนยัน ${pending}`);
    }
  }

  // Quotations
  if (msg.includes("ใบเสนอ") || msg.includes("quotation") || msg.includes("qt") || msg.includes("ราคา")) {
    const { data: qts } = await supabase
      .from("quotations")
      .select("approval_status, price, product, qt_number")
      .limit(200);

    if (qts?.length) {
      const byStatus: Record<string, number> = {};
      for (const q of qts) {
        const s = q.approval_status || "DRAFT";
        byStatus[s] = (byStatus[s] || 0) + 1;
      }
      let qtText = "ใบเสนอราคา:\n";
      for (const [status, count] of Object.entries(byStatus)) {
        qtText += `- ${status}: ${count} ใบ\n`;
      }
      context.push(qtText);
    }
  }

  // Payments
  if (msg.includes("ชำระ") || msg.includes("payment") || msg.includes("เงิน") || msg.includes("สลิป") || msg.includes("ค้างชำระ")) {
    const { data: payments } = await supabase
      .from("payment_installments")
      .select("amount, paid_date, due_date, slip_status")
      .limit(500);

    if (payments?.length) {
      const paid = payments.filter((p: any) => p.paid_date);
      const unpaid = payments.filter((p: any) => !p.paid_date);
      const totalDue = unpaid.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const totalPaid = paid.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      context.push(`การชำระเงิน: ชำระแล้ว ${paid.length} งวด (฿${totalPaid.toLocaleString()}), ค้างชำระ ${unpaid.length} งวด (฿${totalDue.toLocaleString()})`);
    }
  }

  // Installations / maintenance
  if (msg.includes("ติดตั้ง") || msg.includes("install") || msg.includes("pm") || msg.includes("บำรุง") || msg.includes("ซ่อม")) {
    const { data: installs } = await supabase
      .from("installations")
      .select("status, serial_number, products:product_id(product_name)")
      .limit(300);

    if (installs?.length) {
      const byStatus: Record<string, number> = {};
      for (const i of installs) {
        byStatus[i.status || "ไม่ระบุ"] = (byStatus[i.status || "ไม่ระบุ"] || 0) + 1;
      }
      let instText = "เครื่องติดตั้ง:\n";
      for (const [status, count] of Object.entries(byStatus)) {
        instText += `- ${status}: ${count} เครื่อง\n`;
      }
      context.push(instText);
    }

    const { data: tickets } = await supabase
      .from("service_tickets")
      .select("status, priority, symptom, clinic")
      .eq("status", "OPEN")
      .limit(50);

    if (tickets?.length) {
      context.push(`ใบแจ้งซ่อมเปิดอยู่: ${tickets.length} ใบ`);
    }
  }

  // Customers
  if (msg.includes("ลูกค้า") || msg.includes("คลินิก") || msg.includes("customer") || msg.includes("lead")) {
    const { data: accounts } = await supabase
      .from("accounts")
      .select("customer_status, grade")
      .limit(500);

    if (accounts?.length) {
      const byStatus: Record<string, number> = {};
      for (const a of accounts) {
        byStatus[a.customer_status || "ไม่ระบุ"] = (byStatus[a.customer_status || "ไม่ระบุ"] || 0) + 1;
      }
      let accText = "ลูกค้าตามสถานะ:\n";
      for (const [status, count] of Object.entries(byStatus)) {
        accText += `- ${status}: ${count} ราย\n`;
      }
      context.push(accText);
    }
  }

  // Contracts
  if (msg.includes("สัญญา") || msg.includes("contract")) {
    const { data: contracts } = await supabase
      .from("contracts")
      .select("status, product_type, total_price")
      .limit(200);

    if (contracts?.length) {
      const byStatus: Record<string, number> = {};
      for (const c of contracts) {
        byStatus[c.status || "DRAFT"] = (byStatus[c.status || "DRAFT"] || 0) + 1;
      }
      let cText = "สัญญาซื้อขาย:\n";
      for (const [status, count] of Object.entries(byStatus)) {
        cText += `- ${status}: ${count} ฉบับ\n`;
      }
      context.push(cText);
    }
  }

  return context.join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the latest user message for context gathering
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const dbContext = await gatherContext(supabase, lastUserMsg?.content || "");

    const systemPrompt = `คุณคือ "Optima AI" ผู้ช่วยอัจฉริยะของบริษัท Optima Aesthetic
คุณช่วยตอบคำถามเกี่ยวกับข้อมูลภายในบริษัท เช่น สต็อกสินค้า, โอกาสขาย, เดโม, ใบเสนอราคา, การชำระเงิน, การติดตั้ง, การซ่อมบำรุง และลูกค้า

กฎ:
- ตอบเป็นภาษาไทยเสมอ ยกเว้นคำเฉพาะทาง
- ตอบกระชับ ใช้ตัวเลขและข้อมูลจริงจากระบบ
- ถ้าไม่มีข้อมูลในบริบท ให้บอกตรงๆ ว่าไม่มีข้อมูล
- ใช้ Markdown formatting (bullet points, bold, tables) เพื่อความชัดเจน
- สินค้าหลักของบริษัท: ND2 (เครื่องเลเซอร์), Trica 3D, Quattro, Picohi, Freezero และ Cartridge (วัสดุสิ้นเปลือง)
- สถานะสต็อก: พร้อมขาย, ติดจอง, ติดตั้งแล้ว, DEMO/ยืม, รอซ่อม/รอ QC, รอเคลม ตปท.

ข้อมูลจากระบบ ณ ปัจจุบัน:
${dbContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิตหมด กรุณาเติมเครดิต" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("company-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

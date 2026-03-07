import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, clinicName, currentStage, interestedProducts } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "กรุณาเล่าสิ่งที่คุยกับลูกค้า" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `คุณเป็นที่ปรึกษาการขายอุปกรณ์ความงาม/การแพทย์ วิเคราะห์สิ่งที่เซลล์คุยกับลูกค้าแล้วแนะนำ next activity

Pipeline ขั้นตอนการขาย (ต้องเรียงตามลำดับ ห้ามข้ามขั้น ยกเว้นมีสัญญาณชัดว่าลูกค้าพร้อมข้ามไปปิดดีลได้):
1. นัดพบ/Need (NEW_LEAD) → ทำความรู้จัก สำรวจ need
2. Demo Schedule (CONTACTED) → นัดวัน demo
3. Demo/Workshop (DEMO_SCHEDULED) → จัด demo/workshop ให้ลูกค้า
4. Proposal Sent (DEMO_DONE) → ส่งใบเสนอราคา
5. Negotiation (NEGOTIATION) → เจรจาราคา/เงื่อนไข → ปิดดีล

ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น:
{
  "activity_type": "CALL|MEETING|TASK|DEADLINE|DEMO",
  "title": "ชื่อกิจกรรมภาษาไทยสั้นๆ",
  "days_from_now": number (กี่วันจากวันนี้ที่ควรทำ),
  "priority": "LOW|NORMAL|HIGH",
  "description": "สิ่งที่ควรทำ 1 ประโยคสั้นๆ ไม่เกิน 20 คำ",
  "talking_points": ["bullet สั้นมาก 5-10 คำต่อข้อ สูงสุด 4 ข้อ เช่น 'ถามงบประมาณที่ตั้งไว้' 'เสนอแพ็คเกจ demo ฟรี'"],
  "reason": "เหตุผล 1 ประโยคสั้นๆ"
}

กฎการแนะนำตาม Pipeline:
- สถานะ NEW_LEAD → แนะนำ CALL/MEETING เพื่อสำรวจ need และนัด demo ขั้นถัดไป
- สถานะ CONTACTED → แนะนำ TASK นัดวัน demo กับลูกค้า
- สถานะ DEMO_SCHEDULED → แนะนำ DEMO เตรียมจัด demo/workshop
- สถานะ DEMO_DONE → แนะนำ TASK ส่งใบเสนอราคาภายใน 1-2 วัน
- สถานะ NEGOTIATION → แนะนำ CALL/MEETING follow up เจรจาปิดดีล
- ถ้าลูกค้ามีสัญญาณชัดว่าพร้อมซื้อ (เช่น ถามเรื่องผ่อน, ขอส่วนลดสุดท้าย, ถามวันติดตั้ง) → สามารถข้าม step ไปแนะนำ DEADLINE กำหนดวันปิดดีลได้
- talking_points ต้องสั้นมาก 5-10 คำต่อข้อ เป็น action ที่ทำได้ทันที เช่น "ถามจำนวนคนไข้ต่อวัน" "เสนอทดลองใช้ฟรี 1 สัปดาห์"
- description ต้องสั้น 1 ประโยค ไม่เกิน 20 คำ
- reason สั้น 1 ประโยค`;

    const userContent = `ชื่อลูกค้า: ${clinicName || 'ไม่ระบุ'}
สถานะดีลปัจจุบัน: ${currentStage || 'ไม่ระบุ'}
สินค้าที่สนใจ: ${interestedProducts?.join(', ') || 'ไม่ระบุ'}

สิ่งที่คุยกับลูกค้า:
${prompt}`;

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
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิต AI หมด กรุณาเติมเครดิต" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI แนะนำไม่สำเร็จ" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    try {
      const suggestion = JSON.parse(content);
      return new Response(JSON.stringify({ suggestion }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI ตอบกลับไม่ถูกรูปแบบ", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("suggest-activity error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

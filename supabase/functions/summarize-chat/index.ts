import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { images, notes, clinicName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `คุณเป็นผู้ช่วยวิเคราะห์แชทขายอุปกรณ์ความงาม/การแพทย์ ให้สรุปละเอียดประมาณ 300 คำ ภาษาไทย ตามหัวข้อต่อไปนี้:

📌 สนใจอะไร: อธิบายสินค้า/บริการที่ลูกค้าสนใจอย่างละเอียด รวมถึงรุ่น ฟีเจอร์ที่ถามถึง และบริบทการใช้งาน

⚠️ ติดปัญหาอะไร: วิเคราะห์อุปสรรค ข้อกังวล ข้อโต้แย้ง หรือเหตุผลที่ยังไม่ตัดสินใจ ถ้าไม่มีให้ระบุ "ไม่พบปัญหา"

💡 ต้องการ Solution แบบไหน: สรุปว่าลูกค้าต้องการอะไร เช่น ราคาพิเศษ ทดลองใช้ เงื่อนไขผ่อนชำระ การอบรม หรือบริการหลังการขาย

🔥 Urgency: ประเมินความเร่งด่วน (สูง/กลาง/ต่ำ) พร้อมเหตุผลสนับสนุน เช่น มีกำหนดเปิดคลินิก กำลังเปรียบเทียบกับคู่แข่ง

📋 ควร Follow Up: แนะนำ action items ที่เซลล์ควรทำต่อ เรียงลำดับความสำคัญ เช่น ส่งใบเสนอราคา นัด demo จัดอบรม

ให้วิเคราะห์จากภาพแชทและโน้ตอย่างละเอียด อ่านทุกข้อความในแชท ดึงข้อมูลสำคัญทั้งหมดมาสรุป`;

    // Build user content with images and notes
    const userContent: any[] = [];
    
    if (clinicName) {
      userContent.push({ type: "text", text: `ชื่อคลินิก/ลูกค้า: ${clinicName}` });
    }

    if (images && images.length > 0) {
      userContent.push({ type: "text", text: "ภาพแชทที่แคปมา:" });
      for (const img of images) {
        userContent.push({
          type: "image_url",
          image_url: { url: img },
        });
      }
    }

    if (notes) {
      userContent.push({ type: "text", text: `โน้ตเพิ่มเติมจากเซลล์: ${notes}` });
    }

    if (userContent.length === 0) {
      return new Response(JSON.stringify({ error: "กรุณาอัปโหลดรูปหรือพิมพ์โน้ต" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "เครดิต AI หมด กรุณาเติมเครดิต" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI สรุปไม่สำเร็จ" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "ไม่สามารถสรุปได้";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

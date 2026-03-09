import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

function extractStoragePathFromPublicUrl(url: string): string | null {
  // Example: https://.../storage/v1/object/public/quotation-files/<PATH>
  try {
    const u = new URL(url);
    const marker = "/storage/v1/object/public/quotation-files/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: "Server misconfigured" });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const url = new URL(req.url);
    const quotationId = url.searchParams.get("id");
    if (!quotationId) return json(400, { error: "Missing id" });

    const { data: qt, error: qtErr } = await supabase
      .from("quotations")
      .select("id, qt_number, qt_attachment, approval_status")
      .eq("id", quotationId)
      .maybeSingle();
    if (qtErr) return json(500, { error: qtErr.message });
    if (!qt) return json(404, { error: "Quotation not found" });

    const allowed = qt.approval_status === "APPROVED" || qt.approval_status === "CUSTOMER_SIGNED";
    if (!allowed) return json(403, { error: "Quotation not approved" });

    const attachment = qt.qt_attachment as string | null;
    if (!attachment) return json(404, { error: "No attachment" });

    const storagePath = attachment.startsWith("http") ? extractStoragePathFromPublicUrl(attachment) : attachment;
    if (!storagePath) return json(400, { error: "Invalid attachment" });

    const { data: blob, error: dlErr } = await supabase.storage.from("quotation-files").download(storagePath);
    if (dlErr) return json(500, { error: dlErr.message });

    const fileName = `${qt.qt_number ?? "quotation"}.pdf`;

    return new Response(blob.stream(), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/pdf",
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("quotation-pdf error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

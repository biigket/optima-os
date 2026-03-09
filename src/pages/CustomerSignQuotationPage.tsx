import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignatureCanvas from "@/components/ui/SignatureCanvas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CustomerSignQuotationPage() {
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get("id");

  const [openSign, setOpenSign] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerPosition, setSignerPosition] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: qt, isLoading, refetch } = useQuery({
    queryKey: ["public-quotation", quotationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*, accounts!quotations_account_id_fkey(clinic_name, address, phone, email)")
        .eq("id", quotationId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!quotationId,
  });

  const status = useMemo(() => {
    if (!qt) return null;
    return ((qt as any).customer_signature ? "CUSTOMER_SIGNED" : (qt as any).approval_status || "DRAFT") as string;
  }, [qt]);

  const hasAttachment = !!(qt as any)?.qt_attachment;
  const [viewingPdf, setViewingPdf] = useState(false);

  async function handleViewPdf() {
    if (!quotationId) return;
    setViewingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quotation-pdf", {
        body: { quotation_id: quotationId },
      });
      if (error) throw error;
      const html = typeof data === "string" ? data : (await (data as any)?.text?.()) || JSON.stringify(data);
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
      else toast.error("กรุณาอนุญาต popup เพื่อเปิดใบเสนอราคา");
    } catch (err: any) {
      toast.error("เปิด PDF ไม่สำเร็จ: " + (err?.message || ""));
    }
    setViewingPdf(false);
  }

  async function generateAndUploadPdf() {
    if (!quotationId || !qt) return null;

    const { data, error } = await supabase.functions.invoke("generate-quotation-pdf", {
      body: { quotation_id: quotationId },
    });
    if (error) throw error;

    const html = typeof data === "string" ? data : (await (data as any)?.text?.()) || JSON.stringify(data);

    const html2pdf = (await import("html2pdf.js")).default;
    const container = document.createElement("div");
    container.innerHTML = html;

    const printBar = container.querySelector(".print-bar");
    if (printBar) printBar.remove();

    const pageEl = container.querySelector(".page") as HTMLElement | null;
    if (pageEl) {
      pageEl.style.boxShadow = "none";
      pageEl.style.margin = "0";
    }

    document.body.appendChild(container);

    const pdfBlob: Blob = await html2pdf()
      .set({
        margin: 0,
        filename: "quotation.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .outputPdf("blob");

    document.body.removeChild(container);

    const qtNumber = (qt as any)?.qt_number || "QT";
    const fileName = `${qtNumber}_approved.pdf`;
    const filePath = `${(qt as any)?.account_id || "unknown"}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("quotation-files")
      .upload(filePath, pdfBlob, { upsert: true, contentType: "application/pdf" });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("quotation-files").getPublicUrl(filePath);

    // Best-effort update so Customer Card shows the latest file
    await supabase.from("quotations").update({ qt_attachment: urlData.publicUrl } as any).eq("id", quotationId);

    return urlData.publicUrl;
  }

  async function submitSignature() {
    if (!quotationId) return;
    if (!signerName.trim()) return toast.error("กรุณาระบุชื่อ-นามสกุล");
    if (!signerPosition.trim()) return toast.error("กรุณาระบุตำแหน่ง");
    if (!signatureData) return toast.error("กรุณาเซ็นชื่อ");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-sign-quotation", {
        body: {
          quotation_id: quotationId,
          signature: signatureData,
          signer_name: signerName.trim(),
          signer_position: signerPosition.trim(),
        },
      });
      if (error) throw error;
      if ((data as any)?.success !== true) throw new Error((data as any)?.error || "Unknown error");

      setOpenSign(false);
      toast.success("ลงนามสำเร็จ กำลังสร้างไฟล์ PDF...");

      await refetch();
      const url = await generateAndUploadPdf();

      if (url) {
        toast.success("สร้างไฟล์ PDF สำเร็จ");
        window.open(url, "_blank");
      } else {
        toast.success("ลงนามสำเร็จ");
      }
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาด: " + (err?.message || ""));
    } finally {
      setSubmitting(false);
    }
  }

  if (!quotationId) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">ไม่พบรหัสใบเสนอราคา (missing id)</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!qt) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">ไม่พบใบเสนอราคา</div>
      </div>
    );
  }

  const account = (qt as any).accounts;
  const canSign = status === "APPROVED" || status === "CUSTOMER_SIGNED";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 py-3 flex items-center gap-3">
          <img src="/images/optima-logo.png" alt="Optima" className="h-9 w-auto" />
          <div className="text-sm font-semibold tracking-wide">Optima Aesthetic</div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">ใบเสนอราคา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">เลขที่</span>
              <span className="font-semibold">{(qt as any).qt_number || "-"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ลูกค้า</span>
              <span className="font-semibold text-right">{account?.clinic_name || "-"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">สินค้า</span>
              <span className="font-semibold text-right">{(qt as any).product || "-"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ราคารวม</span>
              <span className="font-semibold">฿{Number((qt as any).price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {(qt as any).approved_signature && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground mb-2">อนุมัติโดย Optima Aesthetic</div>
                <div className="flex items-center gap-3">
                  <img
                    src={(qt as any).approved_signature}
                    alt="approved signature"
                    className="h-12 w-auto bg-background rounded"
                  />
                  <div className="text-sm">
                    <div className="font-semibold">{(qt as any).approved_name || ""}</div>
                    <div className="text-xs text-muted-foreground">{(qt as any).approved_position || ""}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          {hasAttachment && (
            <Button variant="outline" className="w-full" onClick={handleViewPdf} disabled={viewingPdf}>
              {viewingPdf ? "กำลังโหลด..." : "ดูใบเสนอราคา (PDF)"}
            </Button>
          )}

          <Button
            className={cn("w-full", status === "CUSTOMER_SIGNED" && "opacity-80")}
            onClick={() => setOpenSign(true)}
            disabled={!canSign}
          >
            ยืนยันใบเสนอราคา และลงนาม
          </Button>

          {!canSign && (
            <div className="text-center text-xs text-muted-foreground">
              ใบเสนอราคานี้ยังไม่อยู่ในสถานะอนุมัติ
            </div>
          )}
        </div>

        {status === "CUSTOMER_SIGNED" && (
          <Card>
            <CardContent className="p-4 text-center space-y-2">
              <div className="text-sm font-semibold">ลงนามเรียบร้อยแล้ว</div>
              <div className="text-xs text-muted-foreground">
                โดย {(qt as any).customer_signer_name || "-"}
              </div>
              {hasAttachment && (
                <Button className="w-full" onClick={handleViewPdf} disabled={viewingPdf}>
                  {viewingPdf ? "กำลังโหลด..." : "ดาวน์โหลด PDF"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={openSign} onOpenChange={setOpenSign}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ลงนามยืนยันใบเสนอราคา</DialogTitle>
            <DialogDescription>กรอกชื่อ-ตำแหน่ง และเซ็นลายเซ็นเพื่อยืนยัน</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ชื่อ-นามสกุล ผู้ลงนาม</Label>
              <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="เช่น นพ.สมชาย รักสุข" />
            </div>
            <div className="space-y-1">
              <Label>ตำแหน่ง</Label>
              <Input value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} placeholder="เช่น ผู้อำนวยการคลินิก" />
            </div>
            <div className="space-y-1">
              <Label>ลายเซ็น</Label>
              <SignatureCanvas onSignatureChange={setSignatureData} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSign(false)} disabled={submitting}>
              ยกเลิก
            </Button>
            <Button onClick={submitSignature} disabled={submitting || !signerName.trim() || !signerPosition.trim() || !signatureData}>
              {submitting ? "กำลังบันทึก..." : "ยืนยันลงนาม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

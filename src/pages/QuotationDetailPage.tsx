import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Building2, Package, CreditCard, Printer, Send, CheckCircle, XCircle, Edit3, AlertTriangle, Link2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useMockAuth } from '@/hooks/useMockAuth';
import { cn } from '@/lib/utils';
import SignatureCanvas from '@/components/ui/SignatureCanvas';

const APPROVAL_FLOW = [
  { key: 'DRAFT', label: 'แบบร่าง' },
  { key: 'SUBMITTED', label: 'รออนุมัติ' },
  { key: 'APPROVED', label: 'อนุมัติแล้ว' },
  { key: 'CUSTOMER_SIGNED', label: 'ลูกค้าเซ็นแล้ว' },
];

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useMockAuth();
  const [printingPDF, setPrintingPDF] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Approve dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [approverPosition, setApproverPosition] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const prevCustomerSigRef = useRef<string | null>(undefined as any);

  async function handlePrintPDF() {
    if (!id) return;
    setPrintingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
        body: { quotation_id: id },
      });
      if (error) throw error;
      const html = typeof data === 'string' ? data : await data.text?.() || JSON.stringify(data);
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
      else toast.error('กรุณาอนุญาต popup เพื่อเปิดใบเสนอราคา');
    } catch (err: any) {
      toast.error('สร้าง PDF ไม่สำเร็จ: ' + (err.message || 'Unknown error'));
    }
    setPrintingPDF(false);
  }

  const { data: qt, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, accounts!quotations_account_id_fkey(clinic_name, address, phone, email)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  async function updateStatus(status: string, extra: Record<string, any> = {}) {
    if (!id) return;
    setUpdating(true);
    const { error } = await supabase
      .from('quotations')
      .update({ approval_status: status, ...extra } as any)
      .eq('id', id);
    setUpdating(false);
    if (error) {
      toast.error('อัปเดตสถานะไม่สำเร็จ: ' + error.message);
      return false;
    }
    queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
    return true;
  }

  async function handleSubmit() {
    const ok = await updateStatus('SUBMITTED', {
      submitted_at: new Date().toISOString(),
      reject_reason: null,
    } as any);
    if (ok) toast.success('ส่งใบเสนอราคาเพื่ออนุมัติแล้ว');
  }

  function openApproveDialog() {
    setApproverName('');
    setApproverPosition('');
    setSignatureData(null);
    setShowApproveDialog(true);
  }

  async function handleApproveConfirm() {
    if (!approverName.trim()) {
      toast.error('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!approverPosition.trim()) {
      toast.error('กรุณาระบุตำแหน่ง');
      return;
    }
    if (!signatureData) {
      toast.error('กรุณาเซ็นชื่อ');
      return;
    }

    const ok = await updateStatus('APPROVED', {
      approved_by: approverName.trim(),
      approved_at: new Date().toISOString(),
      approved_name: approverName.trim(),
      approved_position: approverPosition.trim(),
      approved_signature: signatureData,
    } as any);
    if (ok) {
      toast.success('อนุมัติใบเสนอราคาแล้ว');
      setShowApproveDialog(false);
      // Generate and store PDF
      savePdfToStorage();
    }
  }

  async function savePdfToStorage() {
    if (!id) return;
    try {
      const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
        body: { quotation_id: id },
      });
      if (error) throw error;
      const html = typeof data === 'string' ? data : await data.text?.() || JSON.stringify(data);

      // Convert HTML to PDF using html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.innerHTML = html;
      // Remove print bar from the HTML
      const printBar = container.querySelector('.print-bar');
      if (printBar) printBar.remove();
      // Remove page background styling for clean PDF
      const pageEl = container.querySelector('.page') as HTMLElement;
      if (pageEl) {
        pageEl.style.boxShadow = 'none';
        pageEl.style.margin = '0';
      }
      document.body.appendChild(container);

      const pdfBlob: Blob = await html2pdf()
        .set({
          margin: 0,
          filename: 'quotation.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .outputPdf('blob');

      document.body.removeChild(container);

      const qtNumber = qt?.qt_number || 'QT';
      const fileName = `${qtNumber}_approved.pdf`;
      const filePath = `${qt?.account_id || 'unknown'}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('quotation-files')
        .upload(filePath, pdfBlob, { upsert: true, contentType: 'application/pdf' });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('quotation-files')
        .getPublicUrl(filePath);

      await supabase
        .from('quotations')
        .update({ qt_attachment: urlData.publicUrl } as any)
        .eq('id', id);

      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      toast.success('บันทึกไฟล์ PDF สำเร็จ');
    } catch (err: any) {
      console.error('Save PDF error:', err);
      toast.error('บันทึกไฟล์ PDF ไม่สำเร็จ: ' + (err.message || ''));
    }
  }

  // When customer signs (detected by refetch), auto-regenerate PDF with both signatures
  useEffect(() => {
    if (!qt) return;
    const customerSig = (qt as any).customer_signature;
    if (customerSig && prevCustomerSigRef.current !== customerSig && prevCustomerSigRef.current !== undefined) {
      savePdfToStorage();
      toast.success('ลูกค้าเซ็นใบเสนอราคาแล้ว กำลังสร้าง PDF ใหม่...');
    }
    prevCustomerSigRef.current = customerSig || null;
  }, [(qt as any)?.customer_signature]);

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
      return;
    }
    const ok = await updateStatus('REJECTED', {
      reject_reason: rejectReason.trim(),
      approved_by: currentUser?.name || 'ADMIN',
      approved_at: new Date().toISOString(),
    } as any);
    if (ok) {
      toast.success('ไม่อนุมัติใบเสนอราคา');
      setShowRejectDialog(false);
      setRejectReason('');
    }
  }

  async function handleRevise() {
    const ok = await updateStatus('DRAFT', {
      reject_reason: null,
      approved_by: null,
      approved_at: null,
      submitted_at: null,
      approved_name: null,
      approved_position: null,
      approved_signature: null,
      customer_signature: null,
      customer_signed_at: null,
      customer_signer_name: null,
    } as any);
    if (ok) toast.success('เปลี่ยนสถานะเป็นแบบร่างเพื่อแก้ไข');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!qt) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        ไม่พบใบเสนอราคา
        <div className="mt-4"><Button variant="outline" onClick={() => navigate('/quotations')}>กลับ</Button></div>
      </div>
    );
  }

  const account = qt.accounts as any;
  const paymentLabel: Record<string, string> = { CASH: 'เงินสด', INSTALLMENT: 'ผ่อนชำระ', LEASING: 'ลีสซิ่ง' };
  const status = (qt.customer_signature ? 'CUSTOMER_SIGNED' : qt.approval_status || 'DRAFT') as string;
  const signingUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-sign-quotation?id=${id}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText size={22} className="text-primary" />
            {qt.qt_number || 'ใบเสนอราคา'}
          </h1>
          <p className="text-sm text-muted-foreground">สร้างเมื่อ {qt.created_at ? new Date(qt.created_at).toLocaleDateString('th-TH') : '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          {(status === 'APPROVED' || status === 'CUSTOMER_SIGNED') && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrintPDF} disabled={printingPDF}>
              <Printer size={14} /> {printingPDF ? 'กำลังสร้าง...' : 'พิมพ์ PDF'}
            </Button>
          )}
          <StatusBadge status={status} />
          <StatusBadge status={qt.payment_status || 'UNPAID'} />
        </div>
      </div>

      {/* Approval Flow Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            {APPROVAL_FLOW.map((s, i) => {
              const isCurrent = status === s.key || (status === 'REJECTED' && s.key === 'SUBMITTED');
              const isDone = (status === 'SUBMITTED' && i === 0) ||
                             (status === 'APPROVED' && i <= 1) ||
                             (status === 'CUSTOMER_SIGNED' && i <= 2) ||
                             (status === 'REJECTED' && i === 0);
              const isRejected = status === 'REJECTED' && s.key === 'APPROVED';
              return (
                <div key={s.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                      isDone ? 'bg-primary border-primary text-primary-foreground' :
                      isCurrent ? 'border-primary text-primary bg-primary/10' :
                      isRejected ? 'border-destructive text-destructive bg-destructive/10' :
                      'border-muted-foreground/30 text-muted-foreground'
                    )}>
                      {isDone ? '✓' : isRejected ? '✕' : i + 1}
                    </div>
                    <span className={cn(
                      'text-xs mt-1.5 font-medium text-center',
                      isDone || isCurrent ? 'text-primary' : isRejected ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {isRejected ? 'ไม่อนุมัติ' : s.label}
                    </span>
                  </div>
                  {i < APPROVAL_FLOW.length - 1 && (
                    <div className={cn('h-0.5 w-full mx-2', isDone ? 'bg-primary' : 'bg-muted')} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Reject reason banner */}
          {status === 'REJECTED' && (qt as any).reject_reason && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">เหตุผลที่ไม่อนุมัติ</p>
                <p className="text-sm text-destructive/80">{(qt as any).reject_reason}</p>
              </div>
            </div>
          )}

          {/* Approved info */}
          {(status === 'APPROVED' || status === 'CUSTOMER_SIGNED') && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
              <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">อนุมัติแล้ว</p>
                <p className="text-sm text-green-600">
                  โดย {(qt as any).approved_name || (qt as any).approved_by || '-'}
                  {(qt as any).approved_position && ` (${(qt as any).approved_position})`}
                  {(qt as any).approved_at && ` เมื่อ ${new Date((qt as any).approved_at).toLocaleDateString('th-TH')}`}
                </p>
              </div>
            </div>
          )}

          {/* Customer signed info */}
          {status === 'CUSTOMER_SIGNED' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <CheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700">ลูกค้าเซ็นแล้ว</p>
                <p className="text-sm text-blue-600">
                  โดย {(qt as any).customer_signer_name || '-'}
                  {(qt as any).customer_signed_at && ` เมื่อ ${new Date((qt as any).customer_signed_at).toLocaleDateString('th-TH')}`}
                </p>
              </div>
            </div>
          )}

          {/* Customer signing link - shown when approved but not yet signed by customer */}
          {status === 'APPROVED' && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
              <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1.5">
                <Link2 size={14} /> ส่งลิงก์ให้ลูกค้าเซ็นใบเสนอราคา
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={signingUrl}
                  className="text-xs bg-white flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(signingUrl);
                    toast.success('คัดลอกลิงก์แล้ว');
                  }}
                >
                  <Copy size={14} /> คัดลอก
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 shrink-0"
                  onClick={() => window.open(signingUrl, '_blank')}
                >
                  <ExternalLink size={14} /> เปิด
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {status === 'DRAFT' && (
              <Button size="sm" className="gap-1.5" onClick={handleSubmit} disabled={updating}>
                <Send size={14} /> ส่งอนุมัติ
              </Button>
            )}

            {status === 'SUBMITTED' && isAdmin && (
              <>
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={openApproveDialog} disabled={updating}>
                  <CheckCircle size={14} /> อนุมัติ
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setShowRejectDialog(true)} disabled={updating}>
                  <XCircle size={14} /> ไม่อนุมัติ
                </Button>
              </>
            )}

            {status === 'SUBMITTED' && !isAdmin && (
              <p className="text-sm text-muted-foreground">⏳ รอการอนุมัติจากผู้จัดการ</p>
            )}

            {(status === 'APPROVED' || status === 'CUSTOMER_SIGNED') && isAdmin && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleRevise} disabled={updating}>
                <Edit3 size={14} /> แก้ไข (กลับเป็นแบบร่าง)
              </Button>
            )}

            {status === 'APPROVED' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['quotation', id] });
                  toast.info('รีเฟรชข้อมูลแล้ว');
                }}
              >
                🔄 ตรวจสอบสถานะลูกค้าเซ็น
              </Button>
            )}

            {status === 'REJECTED' && (
              <Button size="sm" className="gap-1.5" onClick={handleRevise} disabled={updating}>
                <Edit3 size={14} /> แก้ไขและส่งใหม่
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 size={16} className="text-primary" /> ข้อมูลลูกค้า
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="ชื่อคลินิก" value={account?.clinic_name} />
            <InfoRow label="ที่อยู่" value={account?.address} />
            <InfoRow label="โทรศัพท์" value={account?.phone} />
            <InfoRow label="อีเมล" value={account?.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText size={16} className="text-primary" /> รายละเอียดใบเสนอราคา
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="เลขที่" value={qt.qt_number} />
            <InfoRow label="วันที่ออก" value={qt.qt_date} />
            <InfoRow label="เซลล์" value={qt.sale_assigned} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package size={16} className="text-primary" /> สินค้าและราคา
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="สินค้า" value={qt.product} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ราคา</span>
              <span className="text-lg font-bold text-foreground">฿{(qt.price || 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} className="text-primary" /> การชำระเงิน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="เงื่อนไข" value={paymentLabel[qt.payment_condition || ''] || qt.payment_condition} />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">สถานะชำระ</span>
              <StatusBadge status={qt.payment_status || 'UNPAID'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">ส่งใบแจ้งหนี้</span>
              <span className="text-sm">{qt.invoice_sent ? '✅ ส่งแล้ว' : '❌ ยังไม่ส่ง'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-green-700">อนุมัติใบเสนอราคา</DialogTitle>
            <DialogDescription>กรุณาเซ็นชื่อและระบุข้อมูลผู้อนุมัติ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">ลายเซ็น <span className="text-destructive">*</span></Label>
              <SignatureCanvas onSignatureChange={setSignatureData} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">ชื่อ-นามสกุล <span className="text-destructive">*</span></Label>
                <Input
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  placeholder="เช่น นายสมชาย ใจดี"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">ตำแหน่ง <span className="text-destructive">*</span></Label>
                <Input
                  value={approverPosition}
                  onChange={e => setApproverPosition(e.target.value)}
                  placeholder="เช่น กรรมการผู้จัดการ"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>ยกเลิก</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApproveConfirm}
              disabled={updating || !approverName.trim() || !approverPosition.trim() || !signatureData}
            >
              {updating ? 'กำลังบันทึก...' : 'ยืนยันอนุมัติ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">ไม่อนุมัติใบเสนอราคา</DialogTitle>
            <DialogDescription>กรุณาระบุเหตุผลที่ไม่อนุมัติ</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="ระบุเหตุผล..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updating || !rejectReason.trim()}>
              {updating ? 'กำลังบันทึก...' : 'ยืนยันไม่อนุมัติ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '-'}</span>
    </div>
  );
}

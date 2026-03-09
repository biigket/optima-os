import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import { CheckCircle, XCircle } from 'lucide-react';

interface InstallmentRow {
  id: string;
  installment_number: number;
  amount: number | null;
  payment_channel: string | null;
  slip_file: string | null;
  slip_status: string | null;
  payment_date: string | null;
  quotation_id: string;
  clinic_name?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  installment: InstallmentRow | null;
  onSuccess: () => void;
}

export default function VerifySlipDialog({ open, onOpenChange, installment, onSuccess }: Props) {
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAction = async (action: 'VERIFIED' | 'REJECTED') => {
    if (!installment) return;
    if (action === 'REJECTED' && !rejectReason.trim()) {
      toast.error('กรุณาระบุเหตุผลที่ปฏิเสธ');
      return;
    }
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        slip_status: action,
        verified_by: 'Finance Admin',
        verified_at: new Date().toISOString(),
      };
      if (action === 'REJECTED') {
        updateData.reject_reason = rejectReason;
      }
      if (action === 'VERIFIED') {
        updateData.paid_date = installment.payment_date || new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase.from('payment_installments').update(updateData as any).eq('id', installment.id);
      if (error) throw error;

      // If verified, check if all installments for this quotation are paid → update quotation payment_status
      if (action === 'VERIFIED') {
        const { data: allInstallments } = await supabase
          .from('payment_installments')
          .select('id, slip_status, paid_date')
          .eq('quotation_id', installment.quotation_id);

        if (allInstallments) {
          const allPaid = allInstallments.every((i: any) => i.slip_status === 'VERIFIED' || i.paid_date);
          const somePaid = allInstallments.some((i: any) => i.slip_status === 'VERIFIED' || i.paid_date);
          const status = allPaid ? 'PAID' : somePaid ? 'PARTIAL' : 'UNPAID';
          await supabase.from('quotations').update({ payment_status: status }).eq('id', installment.quotation_id);
        }
      }

      toast.success(action === 'VERIFIED' ? 'อนุมัติสลิปเรียบร้อย' : 'ปฏิเสธสลิปแล้ว');
      onSuccess();
      onOpenChange(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!installment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>ตรวจสอบสลิป — งวดที่ {installment.installment_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">ลูกค้า:</span>
              <p className="font-medium">{installment.clinic_name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">จำนวนเงิน:</span>
              <p className="font-medium">฿{(installment.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ช่องทาง:</span>
              <p className="font-medium">{installment.payment_channel || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">วันที่ชำระ:</span>
              <p className="font-medium">{installment.payment_date || '-'}</p>
            </div>
          </div>

          {/* Slip image */}
          {installment.slip_file && (
            <div>
              <Label>รูปสลิป</Label>
              <img
                src={installment.slip_file}
                alt="payment slip"
                className="mt-2 w-full max-h-64 object-contain rounded-lg border cursor-pointer"
                onClick={() => window.open(installment.slip_file!, '_blank')}
              />
            </div>
          )}

          {/* Reject reason */}
          <div>
            <Label>เหตุผล (กรณีปฏิเสธ)</Label>
            <Textarea
              className="mt-1"
              placeholder="ระบุเหตุผลที่ปฏิเสธ..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ปิด</Button>
          <Button variant="destructive" onClick={() => handleAction('REJECTED')} disabled={saving}>
            <XCircle size={14} className="mr-1" /> ปฏิเสธ
          </Button>
          <Button onClick={() => handleAction('VERIFIED')} disabled={saving} className="bg-success hover:bg-success/90 text-success-foreground">
            <CheckCircle size={14} className="mr-1" /> อนุมัติ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

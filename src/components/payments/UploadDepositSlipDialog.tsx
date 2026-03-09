import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quotation: { id: string; deposit_amount: number; qt_number: string } | null;
  onSuccess: () => void;
}

export default function UploadDepositSlipDialog({ open, onOpenChange, quotation, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('ไฟล์ต้องไม่เกิน 5MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!quotation || !file) { toast.error('กรุณาอัพโหลดรูปสลิป'); return; }

    setSaving(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `deposit/${quotation.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-slips').upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('payment-slips').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('quotations').update({
        deposit_slip: urlData.publicUrl,
        deposit_slip_status: 'PENDING_VERIFY',
        deposit_paid_date: paymentDate,
        payment_status: 'DEPOSIT_PAID',
      } as any).eq('id', quotation.id);

      if (dbErr) throw dbErr;
      toast.success('อัพโหลดสลิปมัดจำเรียบร้อย');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>อัพโหลดสลิปมัดจำ — {quotation?.qt_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">ยอดมัดจำ</p>
            <p className="text-lg font-bold text-foreground">฿{(quotation?.deposit_amount || 0).toLocaleString()}</p>
          </div>

          {/* Slip upload */}
          <div>
            <Label>รูปสลิปมัดจำ *</Label>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {preview ? (
              <div className="mt-2 relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
                <img src={preview} alt="slip" className="w-full max-h-48 object-contain rounded-lg border" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                  <span className="text-sm font-medium">เปลี่ยนรูป</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-2 w-full border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload size={24} />
                <span className="text-sm">กดเพื่ออัพโหลดรูปสลิปมัดจำ</span>
              </button>
            )}
          </div>

          {/* Payment date */}
          <div>
            <Label>วันที่ชำระมัดจำ</Label>
            <Input type="date" className="mt-1" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving || !file}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกสลิปมัดจำ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

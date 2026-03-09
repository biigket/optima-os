import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  installment: { id: string; amount: number | null; installment_number: number } | null;
  onSuccess: () => void;
}

const CHANNELS = [
  { value: 'TRANSFER', label: 'โอนเงิน' },
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CHECK', label: 'เช็ค' },
  { value: 'CREDIT_CARD', label: 'บัตรเครดิต' },
];

export default function UploadSlipDialog({ open, onOpenChange, installment, onSuccess }: Props) {
  const [channel, setChannel] = useState('TRANSFER');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    if (!installment || !file) { toast.error('กรุณาอัพโหลดรูปสลิป'); return; }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { toast.error('กรุณาระบุจำนวนเงิน'); return; }

    setSaving(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${installment.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-slips').upload(path, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('payment-slips').getPublicUrl(path);

      const { error: dbErr } = await supabase.from('payment_installments').update({
        slip_file: urlData.publicUrl,
        payment_channel: channel,
        amount: parsedAmount,
        payment_date: paymentDate,
        slip_status: 'PENDING_VERIFY',
        slip_uploaded_at: new Date().toISOString(),
      } as any).eq('id', installment.id);

      if (dbErr) throw dbErr;
      toast.success('อัพโหลดสลิปเรียบร้อย');
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
    setAmount('');
    setChannel('TRANSFER');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกการชำระเงิน — งวดที่ {installment?.installment_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slip upload */}
          <div>
            <Label>รูปสลิป *</Label>
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
                <span className="text-sm">กดเพื่ออัพโหลดรูปสลิป</span>
              </button>
            )}
          </div>

          {/* Channel */}
          <div>
            <Label>ช่องทางชำระ</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label>จำนวนเงิน (บาท) *</Label>
            <Input
              type="number"
              className="mt-1"
              placeholder={installment?.amount ? `฿${installment.amount.toLocaleString()}` : '0'}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          {/* Payment date */}
          <div>
            <Label>วันที่ชำระ</Label>
            <Input type="date" className="mt-1" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving || !file}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกสลิป'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

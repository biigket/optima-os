import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { Trica3DStockItem, Trica3DStatus } from '@/data/trica3dMockData';
import { trica3dStatuses } from '@/data/trica3dMockData';

interface Trica3DIntakeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: Trica3DStockItem) => void;
}

export default function Trica3DIntakeForm({ open, onOpenChange, onSubmit }: Trica3DIntakeFormProps) {
  const [form, setForm] = useState({
    serialNumber: '',
    clinic: '',
    status: 'พร้อมขาย' as Trica3DStatus,
    receivedDate: new Date().toISOString().split('T')[0],
    installDate: '',
    failReason: '',
    borrowFrom: '',
    borrowTo: '',
    emailTrica: '',
    notes: '',
    storageLocation: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.serialNumber.trim()) {
      toast.error('กรุณากรอก S/N Trica');
      return;
    }
    const newItem: Trica3DStockItem = {
      id: `trica-${Date.now()}`,
      ...form,
    };
    onSubmit(newItem);
    toast.success(`รับเข้า Stock: ${form.serialNumber}`);
    onOpenChange(false);
    setForm({
      serialNumber: '', clinic: '', status: 'พร้อมขาย', receivedDate: new Date().toISOString().split('T')[0],
      installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">รับ Trica 3D เข้า Stock</DialogTitle>
          <p className="text-sm text-muted-foreground">กรอกข้อมูลเครื่อง Trica 3D เพื่อรับเข้าคลัง</p>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* S/N */}
          <div>
            <Label htmlFor="trica-sn" className="text-xs">S/N Trica <span className="text-destructive">*</span></Label>
            <Input id="trica-sn" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)}
              placeholder="เช่น A0FD10LRCK00BB0707" className="font-mono mt-1" />
          </div>

          <Separator />

          {/* Clinic & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Clinic</Label>
              <Input value={form.clinic} onChange={e => set('clinic', e.target.value)} placeholder="ชื่อคลินิก" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {trica3dStatuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">วันรับเข้า Stock</Label>
              <Input type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">วันที่ติดตั้ง</Label>
              <Input type="date" value={form.installDate} onChange={e => set('installDate', e.target.value)} className="mt-1" />
            </div>
          </div>

          {/* Conditional: เครื่องเสีย */}
          {form.status === 'เครื่องเสีย' && (
            <>
              <Separator />
              <div>
                <Label className="text-xs">สาเหตุเสีย</Label>
                <Input value={form.failReason} onChange={e => set('failReason', e.target.value)} placeholder="ระบุสาเหตุ" className="mt-1" />
              </div>
            </>
          )}

          {/* Conditional: ยืม */}
          {form.status === 'ยืม' && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ยืมตั้งแต่วันที่</Label>
                  <Input type="date" value={form.borrowFrom} onChange={e => set('borrowFrom', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">ยืมถึงวันที่</Label>
                  <Input type="date" value={form.borrowTo} onChange={e => set('borrowTo', e.target.value)} className="mt-1" />
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Additional */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Email Trica</Label>
              <Input type="email" value={form.emailTrica} onChange={e => set('emailTrica', e.target.value)} placeholder="email@example.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">สถานที่เก็บเครื่อง</Label>
              <Input value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="เช่น โกดัง, Office" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">หมายเหตุ</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." rows={2} className="mt-1" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit}>บันทึกรับเข้า Stock</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

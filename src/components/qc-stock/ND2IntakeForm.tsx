import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { ND2StockItem, QcStatus, StockStatus, HrmSellOrKeep } from '@/data/qcMockData';

interface ND2IntakeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: ND2StockItem) => void;
}

export default function ND2IntakeForm({ open, onOpenChange, onSubmit }: ND2IntakeFormProps) {
  const [form, setForm] = useState({
    hntSerialNumber: '',
    hfl1: '',
    hfl2: '',
    hsd1: '',
    hsd2: '',
    hrm: '',
    hrmSellOrKeep: 'ขาย' as HrmSellOrKeep,
    upsStabilizer: '',
    status: 'READY_TO_SELL' as StockStatus,
    reservedFor: '',
    clinic: '',
    qcResult: 'PENDING_QC' as QcStatus,
    qcFailReason: '',
    notes: '',
    receivedDate: new Date().toISOString().split('T')[0],
    inspectionDoc: '',
    storageLocation: '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.hntSerialNumber.trim()) {
      toast.error('กรุณากรอก HNT S/N ND2');
      return;
    }
    const newItem: ND2StockItem = {
      id: `qc-${Date.now()}`,
      productType: 'ND2',
      ...form,
    };
    onSubmit(newItem);
    toast.success(`รับเข้า Stock: ${form.hntSerialNumber}`);
    onOpenChange(false);
    // Reset
    setForm({
      hntSerialNumber: '', hfl1: '', hfl2: '', hsd1: '', hsd2: '', hrm: '',
      hrmSellOrKeep: 'ขาย', upsStabilizer: '', status: 'READY_TO_SELL', reservedFor: '',
      clinic: '', qcResult: 'PENDING_QC', qcFailReason: '', notes: '',
      receivedDate: new Date().toISOString().split('T')[0], inspectionDoc: '', storageLocation: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">รับ ND2 เข้า Stock</DialogTitle>
          <p className="text-sm text-muted-foreground">กรอกข้อมูลเครื่อง New Doublo 2.0 เพื่อรับเข้าคลัง</p>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Section: ตัวเครื่อง */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              ตัวเครื่อง
            </h3>
            <div>
              <Label htmlFor="hnt" className="text-xs">HNT S/N ND2 <span className="text-destructive">*</span></Label>
              <Input id="hnt" value={form.hntSerialNumber} onChange={e => set('hntSerialNumber', e.target.value)}
                placeholder="เช่น HNT01250051" className="font-mono mt-1" />
            </div>
          </div>

          <Separator />

          {/* Section: Handpiece HFL */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Handpiece — HFL
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">1st HFL</Label>
                <Input value={form.hfl1} onChange={e => set('hfl1', e.target.value)} placeholder="S/N" className="font-mono mt-1" />
              </div>
              <div>
                <Label className="text-xs">2nd HFL</Label>
                <Input value={form.hfl2} onChange={e => set('hfl2', e.target.value)} placeholder="S/N" className="font-mono mt-1" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Handpiece HSD */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Handpiece — HSD
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">1st HSD</Label>
                <Input value={form.hsd1} onChange={e => set('hsd1', e.target.value)} placeholder="S/N" className="font-mono mt-1" />
              </div>
              <div>
                <Label className="text-xs">2nd HSD</Label>
                <Input value={form.hsd2} onChange={e => set('hsd2', e.target.value)} placeholder="S/N" className="font-mono mt-1" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: HRM */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Handpiece — HRM
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">HRM S/N</Label>
                <Input value={form.hrm} onChange={e => set('hrm', e.target.value)} placeholder="S/N" className="font-mono mt-1" />
              </div>
              <div>
                <Label className="text-xs">HRM ขายหรือเก็บ</Label>
                <Select value={form.hrmSellOrKeep} onValueChange={v => set('hrmSellOrKeep', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ขาย">ขาย</SelectItem>
                    <SelectItem value="เก็บ">เก็บ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: อุปกรณ์เสริม */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              อุปกรณ์เสริม
            </h3>
            <div>
              <Label className="text-xs">UPS / Stabilizer</Label>
              <Input value={form.upsStabilizer} onChange={e => set('upsStabilizer', e.target.value)} placeholder="S/N (ถ้ามี)" className="font-mono mt-1" />
            </div>
          </div>

          <Separator />

          {/* Section: สถานะ */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              สถานะ
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">STATUS</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READY_TO_SELL">พร้อมขาย</SelectItem>
                    <SelectItem value="RESERVED">ติดจอง</SelectItem>
                    <SelectItem value="INSTALLED">ติดตั้งแล้ว</SelectItem>
                    <SelectItem value="SENT_FOR_REPAIR">ส่งซ่อม</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === 'RESERVED' && (
                <div>
                  <Label className="text-xs">ติดจองที่?</Label>
                  <Input value={form.reservedFor} onChange={e => set('reservedFor', e.target.value)} placeholder="ชื่อคลินิก" className="mt-1" />
                </div>
              )}
              {form.status === 'INSTALLED' && (
                <div>
                  <Label className="text-xs">Clinic</Label>
                  <Input value={form.clinic} onChange={e => set('clinic', e.target.value)} placeholder="ชื่อคลินิก" className="mt-1" />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section: QC */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              QC
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ผลตรวจ QC</Label>
                <Select value={form.qcResult} onValueChange={v => set('qcResult', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_QC">รอ QC</SelectItem>
                    <SelectItem value="QC_PASSED">QC ผ่าน</SelectItem>
                    <SelectItem value="QC_FAILED">QC ไม่ผ่าน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.qcResult === 'QC_FAILED' && (
                <div>
                  <Label className="text-xs">QC ไม่ผ่านเพราะ</Label>
                  <Input value={form.qcFailReason} onChange={e => set('qcFailReason', e.target.value)} placeholder="ระบุสาเหตุ" className="mt-1" />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section: ข้อมูลเพิ่มเติม */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              ข้อมูลเพิ่มเติม
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">วันรับเข้า Stock</Label>
                <Input type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">สถานที่เก็บเครื่อง</Label>
                <Input value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)} placeholder="เช่น คลัง A ชั้น 2" className="mt-1" />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." rows={2} className="mt-1" />
            </div>
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

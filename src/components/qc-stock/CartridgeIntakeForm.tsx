import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { type CartridgeStockItem, type CartridgeType, type CartridgeStatus, cartridgeTypes, cartridgeStatuses } from '@/data/cartridgeMockData';

interface CartridgeIntakeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: CartridgeStockItem) => void;
}

export default function CartridgeIntakeForm({ open, onOpenChange, onSubmit }: CartridgeIntakeFormProps) {
  const [form, setForm] = useState({
    serialNumber: '',
    cartridgeType: '' as CartridgeType | '',
    status: 'พร้อมขาย' as CartridgeStatus,
    qcFailReason: '',
    receivedDate: '',
    storageLocation: '',
  });

  const handleSubmit = () => {
    if (!form.serialNumber.trim()) {
      toast.error('กรุณากรอก Cartridge S/N');
      return;
    }
    if (!form.cartridgeType) {
      toast.error('กรุณาเลือกประเภท Cartridge');
      return;
    }
    if (form.status === 'ไม่ผ่าน QC' && !form.qcFailReason.trim()) {
      toast.error('กรุณาระบุสาเหตุที่ไม่ผ่าน QC');
      return;
    }

    const newItem: CartridgeStockItem = {
      id: `cart-${Date.now()}`,
      serialNumber: form.serialNumber.trim(),
      cartridgeType: form.cartridgeType as CartridgeType,
      status: form.status,
      qcFailReason: form.qcFailReason.trim(),
      receivedDate: form.receivedDate,
      storageLocation: form.storageLocation.trim(),
    };

    onSubmit(newItem);
    toast.success('บันทึก Cartridge เรียบร้อย');
    setForm({
      serialNumber: '',
      cartridgeType: '',
      status: 'พร้อมขาย',
      qcFailReason: '',
      receivedDate: '',
      storageLocation: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">รับ Cartridge เข้า Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Cartridge S/N */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Cartridge S/N <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="เช่น FLA225110069"
              value={form.serialNumber}
              onChange={e => setForm(prev => ({ ...prev, serialNumber: e.target.value }))}
            />
          </div>

          {/* วันที่รับเข้า Stock */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">วันที่รับเข้า Stock</Label>
            <Input
              type="date"
              value={form.receivedDate}
              onChange={e => setForm(prev => ({ ...prev, receivedDate: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Cartridge Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Cartridge <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.cartridgeType}
              onValueChange={v => setForm(prev => ({ ...prev, cartridgeType: v as CartridgeType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท Cartridge" />
              </SelectTrigger>
              <SelectContent>
                {cartridgeTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">STATUS</Label>
            <Select
              value={form.status}
              onValueChange={v => setForm(prev => ({ ...prev, status: v as CartridgeStatus, qcFailReason: v !== 'ไม่ผ่าน QC' ? '' : prev.qcFailReason }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cartridgeStatuses.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* สาเหตุไม่ผ่าน QC */}
          {form.status === 'ไม่ผ่าน QC' && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                สาเหตุไม่ผ่าน QC <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="ระบุสาเหตุ..."
                value={form.qcFailReason}
                onChange={e => setForm(prev => ({ ...prev, qcFailReason: e.target.value }))}
                rows={2}
              />
            </div>
          )}

          {/* เก็บที่ */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">เก็บที่</Label>
            <Select
              value={form.storageLocation}
              onValueChange={v => setForm(prev => ({ ...prev, storageLocation: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกสถานที่เก็บ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="คลัง A ชั้น 1">คลัง A ชั้น 1</SelectItem>
                <SelectItem value="คลัง A ชั้น 2">คลัง A ชั้น 2</SelectItem>
                <SelectItem value="คลัง B ชั้น 1">คลัง B ชั้น 1</SelectItem>
                <SelectItem value="คลัง B ชั้น 2">คลัง B ชั้น 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit}>บันทึก</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

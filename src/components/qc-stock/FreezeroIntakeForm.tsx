import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { unifiedStatuses, type UnifiedStockStatus } from '@/data/unifiedStockStatus';
import type { FreezeroStockItem } from '@/data/freezeroMockData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: FreezeroStockItem) => void;
}

export default function FreezeroIntakeForm({ open, onOpenChange, onSubmit }: Props) {
  const [serialNumber, setSerialNumber] = useState('');
  const [handpiece, setHandpiece] = useState('');
  const [status, setStatus] = useState<UnifiedStockStatus>('พร้อมขาย');
  const [failReason, setFailReason] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSerialNumber(''); setHandpiece(''); setStatus('พร้อมขาย');
    setFailReason(''); setReceivedDate(new Date().toISOString().slice(0, 10));
    setStorageLocation(''); setNotes('');
  };

  const handleSubmit = () => {
    if (!serialNumber.trim()) return;
    onSubmit({
      id: `fz-${Date.now()}`,
      serialNumber: serialNumber.trim(),
      handpiece: handpiece.trim(),
      status, failReason: failReason.trim(),
      receivedDate, storageLocation: storageLocation.trim(),
      notes: notes.trim(),
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>รับเครื่อง Freezero เข้า Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>S/N <span className="text-destructive">*</span></Label>
            <Input placeholder="Serial Number" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Handpiece</Label>
            <Input placeholder="รุ่น Handpiece" value={handpiece} onChange={e => setHandpiece(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>STATUS</Label>
            <Select value={status} onValueChange={v => setStatus(v as UnifiedStockStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {unifiedStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {(status === 'รอซ่อม/รอ QC' || status === 'รอเคลม ตปท.') && (
            <div className="space-y-1.5">
              <Label>เครื่องเสียเพราะ?</Label>
              <Input placeholder="ระบุสาเหตุ" value={failReason} onChange={e => setFailReason(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>วันที่รับเข้า Stock</Label>
            <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>เก็บที่</Label>
            <Input placeholder="สถานที่จัดเก็บ" value={storageLocation} onChange={e => setStorageLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>หมายเหตุ</Label>
            <Textarea placeholder="หมายเหตุเพิ่มเติม" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={!serialNumber.trim()}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { mockND2Stock } from '@/data/qcMockData';
import { mockTrica3DStock } from '@/data/trica3dMockData';
import { mockQuattroStock } from '@/data/quattroMockData';
import { mockPicohiStock } from '@/data/picohiMockData';
import { mockFreezeroStock } from '@/data/freezeroMockData';
import { mockInstallations, type Installation, type ProductCategory } from '@/data/installBaseMockData';
import { unifiedStatusColor } from '@/data/unifiedStockStatus';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: (inst: Installation) => void;
}

interface AvailableItem {
  id: string;
  category: ProductCategory;
  serialNumber: string;
  status: 'พร้อมขาย' | 'ติดจอง';
  reservedFor?: string;
}

export default function AddInstallationDialog({ open, onOpenChange, onInstalled }: Props) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [clinic, setClinic] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState('365');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [notes, setNotes] = useState('');

  const availableItems = useMemo(() => {
    const items: AvailableItem[] = [];
    const validStatuses = ['พร้อมขาย', 'ติดจอง'] as const;

    mockND2Stock.filter(i => (validStatuses as readonly string[]).includes(i.status)).forEach(i =>
      items.push({ id: i.id, category: 'ND2', serialNumber: i.hntSerialNumber, status: i.status as any, reservedFor: i.reservedFor || undefined })
    );
    mockTrica3DStock.filter(i => (validStatuses as readonly string[]).includes(i.status)).forEach(i =>
      items.push({ id: i.id, category: 'Trica 3D', serialNumber: i.serialNumber, status: i.status as any, reservedFor: i.reservedFor || undefined })
    );
    mockQuattroStock.filter(i => (validStatuses as readonly string[]).includes(i.status)).forEach(i =>
      items.push({ id: i.id, category: 'Quattro', serialNumber: i.serialNumber, status: i.status as any, reservedFor: i.reservedFor || undefined })
    );
    mockPicohiStock.filter(i => (validStatuses as readonly string[]).includes(i.status)).forEach(i =>
      items.push({ id: i.id, category: 'Picohi', serialNumber: i.serialNumber, status: i.status as any, reservedFor: i.reservedFor || undefined })
    );
    mockFreezeroStock.filter(i => (validStatuses as readonly string[]).includes(i.status)).forEach(i =>
      items.push({ id: i.id, category: 'Freezero', serialNumber: i.serialNumber, status: i.status as any, reservedFor: i.reservedFor || undefined })
    );

    return items;
  }, []);

  const selectedItem = availableItems.find(i => i.id === selectedItemId);

  const categoryColors: Record<string, string> = {
    'ND2': 'bg-indigo-100 text-indigo-800',
    'Trica 3D': 'bg-violet-100 text-violet-800',
    'Quattro': 'bg-teal-100 text-teal-800',
    'Picohi': 'bg-pink-100 text-pink-800',
    'Freezero': 'bg-cyan-100 text-cyan-800',
  };

  function handleSubmit() {
    if (!selectedItem || !clinic || !installDate) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
      return;
    }

    const wDays = parseInt(warrantyDays) || 365;
    const expiry = new Date(installDate);
    expiry.setDate(expiry.getDate() + wDays);

    const newInst: Installation = {
      id: `inst-${Date.now()}`,
      qcStockItemId: selectedItem.id,
      productCategory: selectedItem.category,
      serialNumber: selectedItem.serialNumber,
      clinic,
      installDate,
      warrantyDays: wDays,
      warrantyExpiry: expiry.toISOString().split('T')[0],
      province,
      region,
      notes,
      pmReports: [],
    };

    // Update QC stock item status to ติดตั้งแล้ว
    updateStockStatus(selectedItem.id, selectedItem.category, clinic);

    onInstalled(newInst);
    onOpenChange(false);
    resetForm();
    toast({ title: 'ลงติดตั้งเรียบร้อย', description: `${selectedItem.category} S/N: ${selectedItem.serialNumber} → ${clinic}` });
  }

  function updateStockStatus(itemId: string, category: ProductCategory, clinicName: string) {
    if (category === 'ND2') {
      const item = mockND2Stock.find(i => i.id === itemId);
      if (item) { item.status = 'ติดตั้งแล้ว'; item.clinic = clinicName; }
    } else if (category === 'Trica 3D') {
      const item = mockTrica3DStock.find(i => i.id === itemId);
      if (item) { item.status = 'ติดตั้งแล้ว'; item.clinic = clinicName; }
    } else if (category === 'Quattro') {
      const item = mockQuattroStock.find(i => i.id === itemId);
      if (item) { item.status = 'ติดตั้งแล้ว'; }
    } else if (category === 'Picohi') {
      const item = mockPicohiStock.find(i => i.id === itemId);
      if (item) { item.status = 'ติดตั้งแล้ว'; }
    } else if (category === 'Freezero') {
      const item = mockFreezeroStock.find(i => i.id === itemId);
      if (item) { item.status = 'ติดตั้งแล้ว'; }
    }
  }

  function resetForm() {
    setSelectedItemId('');
    setClinic('');
    setInstallDate(new Date().toISOString().split('T')[0]);
    setWarrantyDays('365');
    setProvince('');
    setRegion('');
    setNotes('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ลงติดตั้งเครื่อง (Install)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select device from QC stock */}
          <div>
            <Label>เลือกเครื่องจาก QC Stock</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger><SelectValue placeholder="เลือกเครื่อง..." /></SelectTrigger>
              <SelectContent>
                {availableItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColors[item.category] || ''} variant="outline">{item.category}</Badge>
                      <span className="font-mono text-xs">{item.serialNumber}</span>
                      <Badge className={unifiedStatusColor[item.status]} variant="outline">{item.status}</Badge>
                      {item.reservedFor && <span className="text-xs text-muted-foreground">({item.reservedFor})</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              <p><strong>ประเภท:</strong> {selectedItem.category}</p>
              <p><strong>S/N:</strong> {selectedItem.serialNumber}</p>
              <p><strong>สถานะปัจจุบัน:</strong> <Badge className={unifiedStatusColor[selectedItem.status]}>{selectedItem.status}</Badge></p>
            </div>
          )}

          <div>
            <Label>ชื่อคลินิก / ลูกค้า *</Label>
            <Input value={clinic} onChange={e => setClinic(e.target.value)} placeholder="ชื่อคลินิก" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>วันที่ติดตั้ง *</Label>
              <Input type="date" value={installDate} onChange={e => setInstallDate(e.target.value)} />
            </div>
            <div>
              <Label>ระยะประกัน (วัน)</Label>
              <Input type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>จังหวัด</Label>
              <Input value={province} onChange={e => setProvince(e.target.value)} />
            </div>
            <div>
              <Label>ภูมิภาค</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="เลือก..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="เหนือ">เหนือ</SelectItem>
                  <SelectItem value="กลาง">กลาง</SelectItem>
                  <SelectItem value="ใต้">ใต้</SelectItem>
                  <SelectItem value="ตะวันออก">ตะวันออก</SelectItem>
                  <SelectItem value="ตะวันออกเฉียงเหนือ">ตะวันออกเฉียงเหนือ</SelectItem>
                  <SelectItem value="ตะวันตก">ตะวันตก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>หมายเหตุ</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>ยืนยันติดตั้ง</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

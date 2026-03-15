import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockND2Stock } from '@/data/qcMockData';
import { mockTrica3DStock } from '@/data/trica3dMockData';
import { mockQuattroStock } from '@/data/quattroMockData';
import { mockPicohiStock } from '@/data/picohiMockData';
import { mockFreezeroStock } from '@/data/freezeroMockData';
import { mockInstallations, type Installation, type ProductCategory } from '@/data/installBaseMockData';
import { unifiedStatusColor } from '@/data/unifiedStockStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AccountOption {
  id: string;
  clinic_name: string;
}

export default function AddInstallationDialog({ open, onOpenChange, onInstalled }: Props) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [clinic, setClinic] = useState('');
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState('365');
  const [province, setProvince] = useState('');
  const [region, setRegion] = useState('');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  // Fetch accounts from Supabase
  useEffect(() => {
    if (!open) return;
    supabase.from('accounts').select('id, clinic_name').order('clinic_name')
      .then(({ data }) => { if (data) setAccounts(data); });
  }, [open]);

  const filteredAccounts = accountSearch
    ? accounts.filter(a => a.clinic_name.toLowerCase().includes(accountSearch.toLowerCase()))
    : accounts;

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

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
    const clinicName = selectedAccount?.clinic_name || clinic;
    if (!selectedItem || !clinicName || !installDate) {
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
      clinic: clinicName,
      accountId: selectedAccountId || undefined,
      installDate,
      warrantyDays: wDays,
      warrantyExpiry: expiry.toISOString().split('T')[0],
      province,
      region,
      notes,
      replacementHistory: [],
      pmReports: [],
    };

    // Update QC stock item status to ติดตั้งแล้ว
    updateStockStatus(selectedItem.id, selectedItem.category, clinicName);

    onInstalled(newInst);
    onOpenChange(false);
    resetForm();
    toast({ title: 'ลงติดตั้งเรียบร้อย', description: `${selectedItem.category} S/N: ${selectedItem.serialNumber} → ${clinicName}` });
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
    setSelectedAccountId('');
    setClinic('');
    setInstallDate(new Date().toISOString().split('T')[0]);
    setWarrantyDays('365');
    setProvince('');
    setRegion('');
    setNotes('');
    setAccountSearch('');
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

          {/* Customer / Account selector */}
          <div>
            <Label>ชื่อคลินิก / ลูกค้า *</Label>
            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal h-10"
                >
                  <span className={cn(!selectedAccount && !clinic && 'text-muted-foreground')}>
                    {selectedAccount ? selectedAccount.clinic_name : clinic || 'เลือกหรือพิมพ์ชื่อคลินิก...'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={accountSearch}
                    onChange={e => {
                      setAccountSearch(e.target.value);
                      // If typing, clear account selection and use free text
                      if (selectedAccountId) {
                        setSelectedAccountId('');
                      }
                      setClinic(e.target.value);
                    }}
                    placeholder="ค้นหาคลินิก..."
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                  {filteredAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setClinic(acc.clinic_name);
                        setAccountSearch('');
                        setAccountPopoverOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent flex items-center gap-2',
                        selectedAccountId === acc.id && 'bg-accent'
                      )}
                    >
                      {selectedAccountId === acc.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      <span className={selectedAccountId !== acc.id ? 'pl-5' : ''}>{acc.clinic_name}</span>
                    </button>
                  ))}
                  {filteredAccounts.length === 0 && accountSearch && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      ไม่พบในระบบ — จะใช้ชื่อ "{accountSearch}" เป็นข้อความอิสระ
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {selectedAccount && (
              <p className="text-[11px] text-primary mt-1">✓ เชื่อมกับบัตรลูกค้า: {selectedAccount.clinic_name}</p>
            )}
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

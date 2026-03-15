import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockCartridgeStock, type CartridgeType } from '@/data/cartridgeMockData';
import { mockConsumableInstallations, type ConsumableInstallation } from '@/data/consumableBaseMockData';
import { unifiedStatusColor } from '@/data/unifiedStockStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (item: ConsumableInstallation) => void;
}

interface AvailableCartridge {
  id: string;
  cartridgeType: CartridgeType;
  serialNumber: string;
  status: string;
  reservedFor?: string;
}

interface AccountOption {
  id: string;
  clinic_name: string;
}

export default function AddConsumableDialog({ open, onOpenChange, onAdded }: Props) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [clinic, setClinic] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState('180');
  const [notes, setNotes] = useState('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

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
    const validStatuses = ['พร้อมขาย', 'ติดจอง'];
    return mockCartridgeStock
      .filter(i => validStatuses.includes(i.status))
      .map(i => ({
        id: i.id,
        cartridgeType: i.cartridgeType,
        serialNumber: i.serialNumber,
        status: i.status,
        reservedFor: i.reservedFor,
      })) as AvailableCartridge[];
  }, []);

  const selectedItem = availableItems.find(i => i.id === selectedItemId);

  function handleSubmit() {
    const clinicName = selectedAccount?.clinic_name || clinic;
    if (!selectedItem || !clinicName || !deliveryDate) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
      return;
    }

    const wDays = parseInt(warrantyDays) || 180;
    const expiry = new Date(deliveryDate);
    expiry.setDate(expiry.getDate() + wDays);

    const newItem: ConsumableInstallation = {
      id: `cons-${Date.now()}`,
      qcStockItemId: selectedItem.id,
      cartridgeType: selectedItem.cartridgeType,
      serialNumber: selectedItem.serialNumber,
      clinic: clinicName,
      accountId: selectedAccountId || undefined,
      deliveryDate,
      warrantyDays: wDays,
      warrantyExpiry: expiry.toISOString().split('T')[0],
      notes,
    };

    // Update cartridge stock status
    const stockItem = mockCartridgeStock.find(i => i.id === selectedItem.id);
    if (stockItem) {
      stockItem.status = 'ติดตั้งแล้ว';
    }

    onAdded(newItem);
    onOpenChange(false);
    resetForm();
    toast({ title: 'บันทึกการส่งมอบเรียบร้อย', description: `${selectedItem.cartridgeType} S/N: ${selectedItem.serialNumber} → ${clinicName}` });
  }

  function resetForm() {
    setSelectedItemId('');
    setSelectedAccountId('');
    setClinic('');
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setWarrantyDays('180');
    setNotes('');
    setAccountSearch('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ส่งมอบวัสดุสิ้นเปลือง (Cartridge)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select cartridge from QC stock */}
          <div>
            <Label>เลือก Cartridge จาก QC Stock</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger><SelectValue placeholder="เลือก Cartridge..." /></SelectTrigger>
              <SelectContent>
                {availableItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">{item.cartridgeType}</Badge>
                      <span className="font-mono text-xs">{item.serialNumber}</span>
                      <Badge className={unifiedStatusColor[item.status]} variant="outline">{item.status}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              <p><strong>ประเภท:</strong> {selectedItem.cartridgeType}</p>
              <p><strong>S/N:</strong> {selectedItem.serialNumber}</p>
              <p><strong>สถานะปัจจุบัน:</strong> <Badge className={unifiedStatusColor[selectedItem.status]}>{selectedItem.status}</Badge></p>
            </div>
          )}

          {/* Customer / Account selector */}
          <div>
            <Label>ชื่อคลินิก / ลูกค้า *</Label>
            <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10">
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
                      if (selectedAccountId) setSelectedAccountId('');
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
              <Label>วันที่ส่งมอบ *</Label>
              <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <Label>ระยะประกัน (วัน)</Label>
              <Input type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>หมายเหตุ</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>ยืนยันส่งมอบ</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

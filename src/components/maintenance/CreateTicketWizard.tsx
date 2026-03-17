import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Cpu, Package, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Installation } from '@/data/installBaseMockData';
import type { ConsumableInstallation } from '@/data/consumableBaseMockData';
import { type ServiceTicket, type TicketPriority, type TicketItemType } from '@/data/serviceTicketMockData';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: ServiceTicket) => void;
}

type Account = { id: string; clinic_name: string };

interface DeviceRow {
  id: string;
  serial_number: string | null;
  product_id: string | null;
  account_id: string | null;
  products?: { product_name: string } | null;
}

interface ConsumableRow {
  id: string;
  serial_number: string | null;
  cartridge_type: string | null;
  account_id: string | null;
}

export default function CreateTicketWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState('');

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [itemType, setItemType] = useState<TicketItemType>('DEVICE');
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; sn: string; type: TicketItemType } | null>(null);
  const [symptom, setSymptom] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [assignedTo, setAssignedTo] = useState('Tanaka Yuki');

  // Data from DB
  const [accountDevices, setAccountDevices] = useState<DeviceRow[]>([]);
  const [accountConsumables, setAccountConsumables] = useState<ConsumableRow[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from('accounts').select('id, clinic_name').then(({ data }) => {
        if (data) setAccounts(data);
      });
    }
  }, [open]);

  // Fetch devices/consumables when account selected
  useEffect(() => {
    if (!selectedAccount) return;
    supabase.from('installations').select('id, serial_number, product_id, account_id, products(product_name)')
      .eq('account_id', selectedAccount.id)
      .then(({ data }) => { if (data) setAccountDevices(data as any); });
    supabase.from('qc_stock_items').select('id, serial_number, cartridge_type, account_id')
      .eq('account_id', selectedAccount.id)
      .eq('product_type', 'CARTRIDGE')
      .eq('status', 'ติดตั้งแล้ว')
      .then(({ data }) => { if (data) setAccountConsumables(data); });
  }, [selectedAccount]);

  function reset() {
    setStep(1); setSelectedAccount(null); setSelectedItem(null);
    setSymptom(''); setPriority('NORMAL'); setAssignedTo('Tanaka Yuki');
    setAccountSearch(''); setItemType('DEVICE');
    setAccountDevices([]); setAccountConsumables([]);
  }

  const filteredAccounts = accounts.filter(a =>
    !accountSearch || a.clinic_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  async function handleSubmit() {
    if (!selectedAccount || !selectedItem || !symptom.trim()) return;

    // Generate ticket number
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { data: numData } = await supabase.rpc('get_next_doc_number', { p_doc_type: 'SR', p_year_month: ym });
    const ticketNumber = `SR-${ym.replace('-', '')}-${String(numData || 1).padStart(4, '0')}`;

    const { data: inserted } = await supabase.from('service_tickets').insert({
      ticket_number: ticketNumber,
      account_id: selectedAccount.id,
      clinic: selectedAccount.clinic_name,
      item_type: selectedItem.type,
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      serial_number: selectedItem.sn,
      symptom: symptom.trim(),
      status: 'OPEN',
      priority,
      assigned_to: assignedTo,
    }).select().single();

    if (inserted) {
      const ticket: ServiceTicket = {
        id: inserted.id,
        ticketNumber: inserted.ticket_number,
        accountId: inserted.account_id || '',
        clinic: inserted.clinic,
        itemType: inserted.item_type as TicketItemType,
        itemId: inserted.item_id,
        itemName: inserted.item_name,
        serialNumber: inserted.serial_number,
        symptom: inserted.symptom,
        symptomPhotos: [],
        status: 'OPEN',
        priority: inserted.priority as TicketPriority,
        assignedTo: inserted.assigned_to,
        resolution: '',
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at,
        updates: [],
      };
      onCreated(ticket);
      toast({ title: 'สร้างใบแจ้งซ่อมแล้ว', description: ticketNumber });
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-destructive" />
            เปิดใบแจ้งซ่อม
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs mb-2">
          {[
            { n: 1, label: 'เลือกคลินิก' },
            { n: 2, label: 'เลือกเครื่อง/วัสดุ' },
            { n: 3, label: 'แจ้งอาการ' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</div>
              <span className={step >= s.n ? 'font-medium text-foreground' : 'text-muted-foreground'}>{s.label}</span>
              {i < 2 && <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="ค้นหาชื่อคลินิก..." value={accountSearch} onChange={e => setAccountSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
              {filteredAccounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ไม่พบคลินิก</p>}
              {filteredAccounts.map(a => (
                <button key={a.id} onClick={() => { setSelectedAccount(a); setStep(2); }} className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2 ${selectedAccount?.id === a.id ? 'bg-accent' : ''}`}>
                  <Building2 size={14} className="text-muted-foreground shrink-0" />{a.clinic_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedAccount && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">คลินิก: <span className="font-medium text-foreground">{selectedAccount.clinic_name}</span></p>
            <div className="flex gap-2">
              <Button size="sm" variant={itemType === 'DEVICE' ? 'default' : 'outline'} onClick={() => { setItemType('DEVICE'); setSelectedItem(null); }} className="gap-1">
                <Cpu size={14} /> เครื่อง ({accountDevices.length})
              </Button>
              <Button size="sm" variant={itemType === 'CONSUMABLE' ? 'default' : 'outline'} onClick={() => { setItemType('CONSUMABLE'); setSelectedItem(null); }} className="gap-1">
                <Package size={14} /> วัสดุสิ้นเปลือง ({accountConsumables.length})
              </Button>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 border rounded-md p-2">
              {itemType === 'DEVICE' && accountDevices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ไม่มีเครื่องที่ติดตั้ง</p>}
              {itemType === 'DEVICE' && accountDevices.map(d => (
                <button key={d.id} onClick={() => setSelectedItem({ id: d.id, name: (d.products as any)?.product_name || 'Device', sn: d.serial_number || '', type: 'DEVICE' })} className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${selectedItem?.id === d.id ? 'bg-accent ring-1 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{(d.products as any)?.product_name || 'Device'}</span>
                    <Badge variant="outline" className="text-xs">{d.serial_number}</Badge>
                  </div>
                </button>
              ))}
              {itemType === 'CONSUMABLE' && accountConsumables.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ไม่มีวัสดุสิ้นเปลือง</p>}
              {itemType === 'CONSUMABLE' && accountConsumables.map(c => (
                <button key={c.id} onClick={() => setSelectedItem({ id: c.id, name: `Cartridge ${c.cartridge_type}`, sn: c.serial_number || '', type: 'CONSUMABLE' })} className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${selectedItem?.id === c.id ? 'bg-accent ring-1 ring-primary' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cartridge {c.cartridge_type}</span>
                    <Badge variant="outline" className="text-xs">{c.serial_number}</Badge>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" onClick={() => setStep(1)} className="gap-1"><ChevronLeft size={14} /> ย้อนกลับ</Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={!selectedItem} className="gap-1">ถัดไป <ChevronRight size={14} /></Button>
            </div>
          </div>
        )}

        {step === 3 && selectedAccount && selectedItem && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">คลินิก:</span> <span className="font-medium">{selectedAccount.clinic_name}</span></p>
              <p><span className="text-muted-foreground">อุปกรณ์:</span> <span className="font-medium">{selectedItem.name}</span></p>
              <p><span className="text-muted-foreground">S/N:</span> <span className="font-mono">{selectedItem.sn}</span></p>
            </div>
            <div className="space-y-2">
              <Label>อาการที่พบ *</Label>
              <Textarea placeholder="ระบุอาการเสียหรือปัญหาที่พบ..." value={symptom} onChange={e => setSymptom(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ความเร่งด่วน</Label>
                <Select value={priority} onValueChange={v => setPriority(v as TicketPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">ต่ำ</SelectItem>
                    <SelectItem value="NORMAL">ปกติ</SelectItem>
                    <SelectItem value="HIGH">สูง</SelectItem>
                    <SelectItem value="URGENT">เร่งด่วน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>มอบหมายให้</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tanaka Yuki">Tanaka Yuki</SelectItem>
                    <SelectItem value="Priya Sharma">Priya Sharma</SelectItem>
                    <SelectItem value="Mark Santos">Mark Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" onClick={() => setStep(2)} className="gap-1"><ChevronLeft size={14} /> ย้อนกลับ</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!symptom.trim()} className="gap-1">เปิดใบแจ้งซ่อม</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

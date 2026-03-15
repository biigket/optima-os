import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Cpu, Package, ChevronRight, ChevronLeft, AlertTriangle, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mockInstallations, type Installation } from '@/data/installBaseMockData';
import { mockConsumableInstallations, type ConsumableInstallation } from '@/data/consumableBaseMockData';
import {
  type ServiceTicket, type TicketPriority, type TicketItemType,
  getNextTicketNumber, mockServiceTickets,
} from '@/data/serviceTicketMockData';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: ServiceTicket) => void;
}

type Account = { id: string; clinic_name: string };

export default function CreateTicketWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState('');

  // Step 1: selected account
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Step 2: select item
  const [itemType, setItemType] = useState<TicketItemType>('DEVICE');
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; sn: string; type: TicketItemType } | null>(null);

  // Step 3: symptom
  const [symptom, setSymptom] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [assignedTo, setAssignedTo] = useState('Tanaka Yuki');

  useEffect(() => {
    if (open) {
      supabase.from('accounts').select('id, clinic_name').then(({ data }) => {
        if (data) setAccounts(data);
      });
    }
  }, [open]);

  function reset() {
    setStep(1);
    setSelectedAccount(null);
    setSelectedItem(null);
    setSymptom('');
    setPriority('NORMAL');
    setAssignedTo('Tanaka Yuki');
    setAccountSearch('');
    setItemType('DEVICE');
  }

  // Get devices/consumables for selected account
  const accountDevices = selectedAccount
    ? mockInstallations.filter(i => i.accountId === selectedAccount.id || i.clinic.toLowerCase() === selectedAccount.clinic_name.toLowerCase())
    : [];
  const accountConsumables = selectedAccount
    ? mockConsumableInstallations.filter(c => c.accountId === selectedAccount.id || c.clinic.toLowerCase() === selectedAccount.clinic_name.toLowerCase())
    : [];

  const filteredAccounts = accounts.filter(a =>
    !accountSearch || a.clinic_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  function handleSubmit() {
    if (!selectedAccount || !selectedItem || !symptom.trim()) return;

    const ticket: ServiceTicket = {
      id: `st-${Date.now()}`,
      ticketNumber: getNextTicketNumber(),
      accountId: selectedAccount.id,
      clinic: selectedAccount.clinic_name,
      itemType: selectedItem.type,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      serialNumber: selectedItem.sn,
      symptom: symptom.trim(),
      symptomPhotos: [],
      status: 'OPEN',
      priority,
      assignedTo,
      resolution: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updates: [],
    };

    mockServiceTickets.push(ticket);
    onCreated(ticket);
    toast({ title: 'สร้างใบแจ้งซ่อมแล้ว', description: ticket.ticketNumber });
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs mb-2">
          {[
            { n: 1, label: 'เลือกคลินิก' },
            { n: 2, label: 'เลือกเครื่อง/วัสดุ' },
            { n: 3, label: 'แจ้งอาการ' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s.n}
              </div>
              <span className={step >= s.n ? 'font-medium text-foreground' : 'text-muted-foreground'}>{s.label}</span>
              {i < 2 && <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Clinic */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อคลินิก..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
              {filteredAccounts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">ไม่พบคลินิก</p>
              )}
              {filteredAccounts.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setSelectedAccount(a); setStep(2); }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors flex items-center gap-2 ${selectedAccount?.id === a.id ? 'bg-accent' : ''}`}
                >
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  {a.clinic_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Device or Consumable */}
        {step === 2 && selectedAccount && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">คลินิก: <span className="font-medium text-foreground">{selectedAccount.clinic_name}</span></p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={itemType === 'DEVICE' ? 'default' : 'outline'}
                onClick={() => { setItemType('DEVICE'); setSelectedItem(null); }}
                className="gap-1"
              >
                <Cpu size={14} /> เครื่อง ({accountDevices.length})
              </Button>
              <Button
                size="sm"
                variant={itemType === 'CONSUMABLE' ? 'default' : 'outline'}
                onClick={() => { setItemType('CONSUMABLE'); setSelectedItem(null); }}
                className="gap-1"
              >
                <Package size={14} /> วัสดุสิ้นเปลือง ({accountConsumables.length})
              </Button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 border rounded-md p-2">
              {itemType === 'DEVICE' && accountDevices.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">ไม่มีเครื่องที่ติดตั้ง</p>
              )}
              {itemType === 'DEVICE' && accountDevices.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedItem({ id: d.id, name: d.productCategory, sn: d.serialNumber, type: 'DEVICE' })}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${selectedItem?.id === d.id ? 'bg-accent ring-1 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.productCategory}</span>
                    <Badge variant="outline" className="text-xs">{d.serialNumber}</Badge>
                  </div>
                </button>
              ))}

              {itemType === 'CONSUMABLE' && accountConsumables.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">ไม่มีวัสดุสิ้นเปลือง</p>
              )}
              {itemType === 'CONSUMABLE' && accountConsumables.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedItem({ id: c.id, name: `Cartridge ${c.cartridgeType}`, sn: c.serialNumber, type: 'CONSUMABLE' })}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${selectedItem?.id === c.id ? 'bg-accent ring-1 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cartridge {c.cartridgeType}</span>
                    <Badge variant="outline" className="text-xs">{c.serialNumber}</Badge>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" onClick={() => setStep(1)} className="gap-1">
                <ChevronLeft size={14} /> ย้อนกลับ
              </Button>
              <Button size="sm" onClick={() => setStep(3)} disabled={!selectedItem} className="gap-1">
                ถัดไป <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Symptom Form */}
        {step === 3 && selectedAccount && selectedItem && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-md p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">คลินิก:</span> <span className="font-medium">{selectedAccount.clinic_name}</span></p>
              <p><span className="text-muted-foreground">อุปกรณ์:</span> <span className="font-medium">{selectedItem.name}</span></p>
              <p><span className="text-muted-foreground">S/N:</span> <span className="font-mono">{selectedItem.sn}</span></p>
            </div>

            <div className="space-y-2">
              <Label>อาการที่พบ *</Label>
              <Textarea
                placeholder="ระบุอาการเสียหรือปัญหาที่พบ..."
                value={symptom}
                onChange={e => setSymptom(e.target.value)}
                rows={4}
              />
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
              <Button size="sm" variant="outline" onClick={() => setStep(2)} className="gap-1">
                <ChevronLeft size={14} /> ย้อนกลับ
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!symptom.trim()} className="gap-1">
                เปิดใบแจ้งซ่อม
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

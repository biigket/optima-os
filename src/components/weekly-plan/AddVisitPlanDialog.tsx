import { useState, useEffect, useMemo } from 'react';
import { Search, Building2, Plus, ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuickNoteButtons from '@/components/ui/QuickNoteButtons';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMockAuth, MOCK_SALES } from '@/hooks/useMockAuth';
import { Star } from 'lucide-react';

interface Account {
  id: string;
  clinic_name: string;
  customer_status: string;
  address: string | null;
  phone: string | null;
}

interface AddVisitPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  startTime: string;
  endTime: string;
  onSuccess: () => void;
}

const ENTITY_TYPES = ['บุคคลธรรมดา', 'นิติบุคคล', 'คลินิก', 'โรงพยาบาล'];
const BRANCH_TYPES = ['สำนักงานใหญ่', 'สาขา'];
const LEAD_SOURCE_OPTIONS = ['เพื่อนแนะนำ', 'Social media', 'งานแสดงสินค้า'];

const emptyForm = {
  clinic_name: '',
  company_name: '',
  address: '',
  tax_id: '',
  entity_type: '',
  branch_type: '',
  phone: '',
  email: '',
  customer_status: 'NEW_LEAD',
  assigned_sale: '',
  lead_source: '',
  notes: '',
  grade: '',
  single_or_chain: '',
  current_devices: '',
  contact_name: '',
  contact_role: '',
  contact_phone: '',
  contact_email: '',
  custom_lead_source: '',
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            size={20}
            className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  );
}

export default function AddVisitPlanDialog({
  open, onOpenChange, selectedDate, startTime, endTime, onSuccess
}: AddVisitPlanDialogProps) {
  const { currentUser } = useMockAuth();
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      fetchAccounts();
      setSearch('');
      setSelectedAccount(null);
      setShowCreateForm(false);
      setForm(emptyForm);
    }
  }, [open]);

  async function fetchAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from('accounts')
      .select('id, clinic_name, customer_status, address, phone')
      .order('clinic_name');
    if (data) setAccounts(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      a.clinic_name.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q) ||
      a.phone?.includes(q)
    );
  }, [accounts, search]);

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  async function handleCreateAccount() {
    if (!form.clinic_name?.trim()) {
      toast.error('กรุณากรอกชื่อคลินิก');
      return;
    }
    if (!form.contact_name?.trim()) {
      toast.error('กรุณากรอกชื่อผู้ติดต่อ');
      return;
    }

    setSaving(true);
    const resolvedLeadSource = form.lead_source === 'OTHER' ? (form.custom_lead_source || null) : (form.lead_source || null);

    const payload = {
      clinic_name: form.clinic_name.trim(),
      company_name: form.company_name || null,
      address: form.address || null,
      tax_id: form.tax_id || null,
      entity_type: form.entity_type || null,
      branch_type: form.branch_type || null,
      phone: form.phone || null,
      email: form.email || null,
      customer_status: form.customer_status || 'NEW_LEAD',
      assigned_sale: form.assigned_sale || currentUser?.name || null,
      lead_source: resolvedLeadSource,
      notes: form.notes || null,
      grade: form.grade || null,
      single_or_chain: form.single_or_chain || null,
      current_devices: form.current_devices.trim() || null,
    };

    const { data: newAcc, error } = await supabase.from('accounts').insert(payload).select('id, clinic_name, customer_status, address, phone').single();
    if (error || !newAcc) {
      toast.error('เพิ่มลูกค้าไม่สำเร็จ');
      setSaving(false);
      return;
    }

    // Insert contact
    await supabase.from('contacts').insert({
      account_id: newAcc.id,
      name: form.contact_name.trim(),
      role: form.contact_role || null,
      phone: form.contact_phone || null,
      email: form.contact_email || null,
    });

    toast.success('เพิ่มลูกค้าใหม่สำเร็จ');

    // Auto-select the new account and go back to search view
    setSelectedAccount(newAcc);
    setAccounts(prev => [newAcc, ...prev]);
    setShowCreateForm(false);
    setForm(emptyForm);
    setSaving(false);
  }

  async function handleSave() {
    if (!selectedAccount) return;
    setSaving(true);
    const { error } = await supabase.from('visit_plans').insert({
      plan_date: format(selectedDate, 'yyyy-MM-dd'),
      account_id: selectedAccount.id,
      visit_type: 'EXISTING',
      start_time: startTime,
      end_time: endTime,
    });
    setSaving(false);
    if (error) return;
    onSuccess();
    onOpenChange(false);
  }

  // CREATE FORM VIEW
  if (showCreateForm) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowCreateForm(false)}>
                <ChevronLeft size={16} />
              </Button>
              <div>
                <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลลูกค้าใหม่เพื่อลงแผนเยี่ยม</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อคลินิก *</Label>
              <Input value={form.clinic_name} onChange={e => updateField('clinic_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อบริษัท</Label>
              <Input value={form.company_name} onChange={e => updateField('company_name', e.target.value)} />
            </div>

            {/* ผู้ติดต่อหลัก */}
            <div className="sm:col-span-2 space-y-3 p-3 rounded-md border border-primary/30 bg-primary/5">
              <p className="text-sm font-medium text-foreground">ผู้ติดต่อหลัก <span className="text-destructive">*</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ชื่อผู้ติดต่อ <span className="text-destructive">*</span></Label>
                  <Input value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)} placeholder="เช่น นพ. สมชาย" />
                </div>
                <div className="space-y-1.5">
                  <Label>ตำแหน่ง / บทบาท</Label>
                  <Input value={form.contact_role} onChange={e => updateField('contact_role', e.target.value)} placeholder="เช่น Owner, Doctor" />
                </div>
                <div className="space-y-1.5">
                  <Label>เบอร์โทรผู้ติดต่อ</Label>
                  <Input value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} placeholder="08x-xxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>อีเมลผู้ติดต่อ</Label>
                  <Input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} placeholder="email@example.com" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>ที่อยู่</Label>
              <Input value={form.address} onChange={e => updateField('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>เลขประจำตัวผู้เสียภาษี</Label>
              <Input value={form.tax_id} onChange={e => updateField('tax_id', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทนิติบุคคล</Label>
              <Select value={form.entity_type || ''} onValueChange={v => updateField('entity_type', v)}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทสาขา</Label>
              <Select value={form.branch_type || ''} onValueChange={v => updateField('branch_type', v)}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {BRANCH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>โทรศัพท์คลินิก</Label>
              <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>เซลล์ผู้ดูแล</Label>
              <Select value={form.assigned_sale || ''} onValueChange={v => updateField('assigned_sale', v)}>
                <SelectTrigger><SelectValue placeholder="เลือกเซลล์" /></SelectTrigger>
                <SelectContent>
                  {MOCK_SALES.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>แหล่งที่มา</Label>
              <Select value={form.lead_source || ''} onValueChange={v => updateField('lead_source', v)}>
                <SelectTrigger><SelectValue placeholder="เลือกแหล่งที่มา" /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  <SelectItem value="OTHER">อื่นๆ (ระบุเอง)</SelectItem>
                </SelectContent>
              </Select>
              {form.lead_source === 'OTHER' && (
                <Input className="mt-1.5" value={form.custom_lead_source} onChange={e => updateField('custom_lead_source', e.target.value)} placeholder="ระบุแหล่งที่มา..." />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>เกรด</Label>
              <StarRating value={parseInt(form.grade) || 0} onChange={v => updateField('grade', v.toString())} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>เครื่องที่มีอยู่แล้ว</Label>
              <Textarea value={form.current_devices} onChange={e => updateField('current_devices', e.target.value)} rows={2} placeholder="พิมพ์ชื่อเครื่องที่ลูกค้ามีอยู่..." />
              <QuickNoteButtons value={form.current_devices} onChange={v => updateField('current_devices', v)} storageKey="quick_notes_devices" defaults={['Doublo Gold', 'Ultraformer III', 'HIFU เก่า', 'Thermage FLX']} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateAccount} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'เพิ่มลูกค้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // SEARCH VIEW (default)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>เพิ่มแผนเยี่ยมลูกค้า</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: th })} · {startTime} – {endTime}
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Selected */}
          {selectedAccount && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 flex items-center gap-3">
              <Building2 size={18} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedAccount.clinic_name}</p>
                {selectedAccount.address && (
                  <p className="text-xs text-muted-foreground truncate">{selectedAccount.address}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{selectedAccount.customer_status}</Badge>
            </div>
          )}

          {/* Account list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">กำลังโหลด...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">ไม่พบลูกค้า</p>
            ) : (
              filtered.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <Building2 size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                    {account.address && (
                      <p className="text-xs text-muted-foreground truncate">{account.address}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={handleSave} disabled={!selectedAccount || saving} className="w-full">
              {saving ? 'กำลังบันทึก...' : 'เพิ่มแผนเยี่ยม'}
            </Button>
            <Button variant="outline" className="w-full gap-1.5 text-xs" onClick={() => setShowCreateForm(true)}>
              <Plus size={14} /> สร้างลูกค้าใหม่
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import {
  Search, Building2, ChevronLeft, ChevronRight, User, ClipboardList, CheckCircle2,
  X, UserPlus, AlertTriangle, ExternalLink, Users, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Account, OpportunityStage, Opportunity } from '@/types';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const BUDGET_RANGES = [
  { value: '<500K', label: 'ต่ำกว่า 500K' },
  { value: '500K-1M', label: '500K-1M' },
  { value: '1-2M', label: '1-2M' },
  { value: '>2-3M', label: '>2-3M' },
  { value: '>3M', label: '>3M' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CREDIT_CARD', label: 'บัตรเครดิต' },
  { value: 'LEASING', label: 'ลีสซิ่ง' },
];

const CREDIT_CARD_OPTIONS = [
  { value: 'FULL', label: 'รูดเต็ม' },
  { value: 'INST_3', label: 'ผ่อน 3 เดือน' },
  { value: 'INST_6', label: 'ผ่อน 6 เดือน' },
  { value: 'INST_10', label: 'ผ่อน 10 เดือน' },
];

const DEFAULT_COMPETITORS = ['Ultherapy', 'Thermage', 'HIFU (อื่นๆ)', 'Sofwave', 'Morpheus8'];

const STAGES: { value: string; label: string }[] = [
  { value: 'NEW_LEAD', label: 'นัดพบ/ค้นหา Need' },
  { value: 'CONTACTED', label: 'Demo Schedule' },
  { value: 'DEMO_SCHEDULED', label: 'Demo/Workshop' },
  { value: 'DEMO_DONE', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
];

const STEPS = [
  { key: 'customer', label: 'ลูกค้า', icon: User },
  { key: 'deal', label: 'รายละเอียด', icon: ClipboardList },
  { key: 'confirm', label: 'ยืนยัน', icon: CheckCircle2 },
] as const;

interface Product {
  id: string;
  product_name: string;
  category: string;
  base_price: number | null;
}

interface ContactItem {
  id: string;
  account_id: string;
  name: string;
  phone?: string | null;
  is_decision_maker?: boolean | null;
}

interface CreateOpportunityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Opportunity) => void;
  /** Optional: pre-select customer (skip step 1) */
  customer?: Account | null;
}

// --- Step Indicator ---
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-6 py-3">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={step.key} className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              isActive ? 'bg-primary text-primary-foreground' :
              isDone ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            )}>
              <Icon size={20} />
            </div>
            <span className={cn('text-xs font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Multi-select with custom ---
function MultiSelectWithCustom({ label, options: defaultOptions, selected, onChange, placeholder }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [customInput, setCustomInput] = useState('');
  const [allOptions, setAllOptions] = useState(defaultOptions);

  useEffect(() => {
    const extras = selected.filter(s => !defaultOptions.includes(s));
    if (extras.length > 0) setAllOptions([...defaultOptions, ...extras]);
  }, []);

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  };

  const addCustom = () => {
    const t = customInput.trim();
    if (!t) return;
    if (!allOptions.includes(t)) setAllOptions(prev => [...prev, t]);
    if (!selected.includes(t)) onChange([...selected, t]);
    setCustomInput('');
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {t}
              <button onClick={() => onChange(selected.filter(x => x !== t))} className="hover:text-destructive"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="border rounded-md p-2 space-y-1">
        {allOptions.map(opt => (
          <label key={opt} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span className="text-xs">{opt}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          className="h-7 text-xs flex-1"
          placeholder={placeholder || 'เพิ่มรายการใหม่...'}
        />
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={addCustom} disabled={!customInput.trim()}>
          เพิ่ม
        </Button>
      </div>
    </div>
  );
}

export default function CreateOpportunityForm({ open, onOpenChange, onSave, customer: preselectedCustomer }: CreateOpportunityFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1: customer selection
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(null);

  // Step 2: deal details
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const [form, setForm] = useState({
    selectedProductIds: [] as string[],
    deal_value: '',
    stage: '' as OpportunityStage | '',
    close_date: '',
    notes: '',
    budget_range: '',
    payment_method: '',
    credit_card_option: '',
    competitors: [] as string[],
    authority_contact_id: '',
  });

  // Reset on open
  useEffect(() => {
    if (!open) return;
    resetAll();
    if (preselectedCustomer) {
      setSelectedCustomer(preselectedCustomer);
      setStep(1);
      fetchDealData(preselectedCustomer.id);
    } else {
      fetchAccounts();
    }
  }, [open]);

  function resetAll() {
    setStep(0);
    setSearch('');
    setSelectedCustomer(null);
    setProducts([]);
    setContacts([]);
    setShowAddContact(false);
    setNewContactName('');
    setNewContactPhone('');
    setForm({
      selectedProductIds: [], deal_value: '', stage: '', close_date: '', notes: '',
      budget_range: '', payment_method: '', credit_card_option: '', competitors: [],
      authority_contact_id: '',
    });
  }

  async function fetchAccounts() {
    setLoadingAccounts(true);
    const { data } = await supabase.from('accounts').select('*').order('clinic_name');
    if (data) setAccounts(data as unknown as Account[]);
    setLoadingAccounts(false);
  }

  async function fetchDealData(accountId: string) {
    const [prodRes, conRes] = await Promise.all([
      supabase.from('products').select('id, product_name, category, base_price').eq('category', 'DEVICE'),
      supabase.from('contacts').select('id, account_id, name, phone, is_decision_maker').eq('account_id', accountId),
    ]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    if (conRes.data) setContacts(conRes.data as ContactItem[]);
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

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(p => p !== id)
        : [...f.selectedProductIds, id],
    }));
  };

  const currentStage = form.stage || 'NEW_LEAD';
  const closeDateDays = form.close_date ? differenceInDays(new Date(form.close_date), new Date()) : null;
  const canSave = form.selectedProductIds.length > 0 && !!form.deal_value;

  const handleSelectCustomer = (account: Account) => {
    setSelectedCustomer(account);
    fetchDealData(account.id);
    setStep(1);
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !selectedCustomer) return;
    const { data, error } = await supabase.from('contacts').insert({
      account_id: selectedCustomer.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim() || null,
      is_decision_maker: true,
    }).select('id, account_id, name, phone, is_decision_maker').single();
    if (error) { toast.error('เพิ่มผู้ติดต่อไม่สำเร็จ'); return; }
    if (data) {
      const c = data as ContactItem;
      setContacts(prev => [...prev, c]);
      set('authority_contact_id', c.id);
      toast.success('เพิ่มผู้ติดต่อแล้ว');
    }
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleSave = () => {
    if (!selectedCustomer) return;
    const selectedProducts = products.filter(p => form.selectedProductIds.includes(p.id));
    const paymentMethodFull = form.payment_method === 'CREDIT_CARD' && form.credit_card_option
      ? `CREDIT_CARD:${form.credit_card_option}` : form.payment_method;

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      account_id: selectedCustomer.id,
      stage: currentStage as OpportunityStage,
      opportunity_type: 'DEVICE',
      interested_products: selectedProducts.map(p => p.product_name),
      expected_value: Number(form.deal_value),
      assigned_sale: selectedCustomer.assigned_sale || undefined,
      close_date: form.close_date || undefined,
      notes: form.notes || undefined,
      budget_range: form.budget_range || undefined,
      payment_method: paymentMethodFull || undefined,
      competitors: form.competitors.join(', ') || undefined,
      authority_contact_id: form.authority_contact_id || undefined,
      needs: undefined,
      created_at: new Date().toISOString(),
    };

    onSave(newOpp);
    toast.success('สร้างโอกาสขายสำเร็จ');
    onOpenChange(false);
  };

  function goNext() {
    if (step === 0 && !selectedCustomer) { toast.error('กรุณาเลือกลูกค้า'); return; }
    if (step === 1) {
      if (!canSave) { toast.error('กรุณาเลือกสินค้าและระบุมูลค่าดีล'); return; }
      if (contacts.length === 0) { toast.error('กรุณาเพิ่มผู้ติดต่อ'); return; }
    }
    setStep(s => Math.min(s + 1, 2));
  }

  function goBack() {
    if (step === 1 && preselectedCustomer) { onOpenChange(false); return; }
    setStep(s => Math.max(s - 1, 0));
  }

  const selectedProducts = products.filter(p => form.selectedProductIds.includes(p.id));
  const authorityContact = contacts.find(c => c.id === form.authority_contact_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>เพิ่มดีลใหม่</DialogTitle>
          <DialogDescription className="sr-only">สร้างโอกาสขายใหม่</DialogDescription>
          {selectedCustomer && step > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={14} />
              <span className="font-medium text-foreground">{selectedCustomer.clinic_name}</span>
              <StatusBadge status={selectedCustomer.customer_status} />
            </div>
          )}
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* STEP 0: Select Customer */}
          {step === 0 && (
            <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
              <div className="relative px-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, ที่อยู่, เบอร์โทร..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5 px-1 min-h-0">
                {loadingAccounts ? (
                  <p className="text-center text-xs text-muted-foreground py-8">กำลังโหลด...</p>
                ) : (
                  <>
                    {filtered.map(account => (
                      <button
                        key={account.id}
                        onClick={() => handleSelectCustomer(account)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left border',
                          selectedCustomer?.id === account.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {account.address || '-'}
                            {account.phone && ` • ${account.phone}`}
                          </p>
                        </div>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-8">ไม่พบลูกค้าที่ตรงกัน</p>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => { onOpenChange(false); navigate('/leads?action=create'); }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
              >
                <Plus size={16} /> สร้างลูกค้าใหม่
              </button>
            </div>
          )}

          {/* STEP 1: Deal Details */}
          {step === 1 && (
            <div className="flex-1 overflow-y-auto space-y-4 px-1 min-h-0">
              {/* Authority */}
              <div className="space-y-1.5">
                <Label className="text-xs">ผู้มีอำนาจตัดสินใจ</Label>
                {contacts.length === 0 && !showAddContact && (
                  <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-destructive">กรุณาเพิ่มผู้ติดต่อก่อน</p>
                    </div>
                  </div>
                )}
                <Select value={form.authority_contact_id} onValueChange={v => {
                  if (v === '__add_new__') { setShowAddContact(true); return; }
                  set('authority_contact_id', v);
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือกผู้มีอำนาจตัดสินใจ" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.is_decision_maker ? '⭐' : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-xs text-primary">
                      <span className="flex items-center gap-1"><UserPlus size={10} /> เพิ่มผู้ติดต่อใหม่</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {showAddContact && (
                  <div className="p-3 rounded-md border border-primary/20 bg-primary/5 space-y-2">
                    <p className="text-xs font-medium">เพิ่มผู้ติดต่อใหม่</p>
                    <Input value={newContactName} onChange={e => setNewContactName(e.target.value)} className="h-8 text-xs" placeholder="ชื่อผู้ติดต่อ *" />
                    <Input value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} className="h-8 text-xs" placeholder="เบอร์โทร" />
                    <div className="flex gap-2">
                      <Button type="button" size="sm" className="h-7 text-xs" onClick={handleAddContact} disabled={!newContactName.trim()}>บันทึก</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAddContact(false)}>ยกเลิก</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Products */}
              <div className="space-y-1.5">
                <Label className="text-xs">สินค้า <span className="text-destructive">*</span></Label>
                {form.selectedProductIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {form.selectedProductIds.map(id => {
                      const p = products.find(pr => pr.id === id);
                      return p ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {p.product_name}
                          <button onClick={() => toggleProduct(id)} className="hover:text-destructive"><X size={10} /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="border rounded-md p-2 space-y-1">
                  {products.length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">ไม่พบสินค้า</p>}
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={form.selectedProductIds.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                      <span className="text-xs flex-1">{p.product_name}</span>
                      {p.base_price && <span className="text-xs text-muted-foreground">฿{p.base_price.toLocaleString()}</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Deal value */}
              <div className="space-y-1.5">
                <Label className="text-xs">มูลค่าดีล (฿) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.deal_value} onChange={e => set('deal_value', e.target.value)} className="h-9 text-xs" placeholder="0" />
              </div>

              {/* Stage */}
              <div className="space-y-1.5">
                <Label className="text-xs">ขั้นตอน</Label>
                <Select value={currentStage} onValueChange={v => set('stage', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Close date */}
              <div className="space-y-1.5">
                <Label className="text-xs">วันปิดคาดการณ์</Label>
                <Input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} className="h-9 text-xs" />
                {closeDateDays !== null && (
                  <p className={`text-[10px] font-medium ${closeDateDays >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {closeDateDays >= 0 ? `อีก ${closeDateDays} วัน` : `เลยกำหนด ${Math.abs(closeDateDays)} วัน`}
                  </p>
                )}
              </div>

              {/* Additional info */}
              <div className="p-3 rounded-md border border-muted bg-muted/30 space-y-3">
                <p className="text-xs font-medium text-foreground">ข้อมูลเพิ่มเติม</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">งบประมาณลูกค้า</Label>
                    <Select value={form.budget_range} onValueChange={v => set('budget_range', v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map(b => <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ช่องทางชำระ</Label>
                    <Select value={form.payment_method} onValueChange={v => { set('payment_method', v); set('credit_card_option', ''); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.payment_method === 'CREDIT_CARD' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">เงื่อนไขบัตรเครดิต</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CREDIT_CARD_OPTIONS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => set('credit_card_option', c.value)}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${form.credit_card_option === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <MultiSelectWithCustom
                  label="คู่แข่งที่เปรียบเทียบ"
                  options={DEFAULT_COMPETITORS}
                  selected={form.competitors}
                  onChange={t => set('competitors', t)}
                  placeholder="เพิ่มคู่แข่งใหม่..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">หมายเหตุ</Label>
                <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="text-xs min-h-[60px] resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
              </div>
            </div>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && selectedCustomer && (
            <div className="flex-1 overflow-y-auto px-1 min-h-0">
              <div className="space-y-3">
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <h3 className="text-sm font-bold text-foreground">สรุปข้อมูลดีล</h3>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">ลูกค้า</span>
                      <p className="font-medium text-foreground">{selectedCustomer.clinic_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ขั้นตอน</span>
                      <p className="font-medium text-foreground">{STAGES.find(s => s.value === currentStage)?.label || currentStage}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">สินค้า</span>
                      <p className="font-medium text-foreground">{selectedProducts.map(p => p.product_name).join(', ') || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">มูลค่าดีล</span>
                      <p className="font-medium text-foreground">฿{Number(form.deal_value || 0).toLocaleString()}</p>
                    </div>
                    {authorityContact && (
                      <div>
                        <span className="text-muted-foreground">ผู้มีอำนาจ</span>
                        <p className="font-medium text-foreground">{authorityContact.name}</p>
                      </div>
                    )}
                    {form.close_date && (
                      <div>
                        <span className="text-muted-foreground">วันปิดคาดการณ์</span>
                        <p className="font-medium text-foreground">{form.close_date}</p>
                      </div>
                    )}
                    {form.budget_range && (
                      <div>
                        <span className="text-muted-foreground">งบประมาณ</span>
                        <p className="font-medium text-foreground">{BUDGET_RANGES.find(b => b.value === form.budget_range)?.label}</p>
                      </div>
                    )}
                    {form.payment_method && (
                      <div>
                        <span className="text-muted-foreground">ช่องทางชำระ</span>
                        <p className="font-medium text-foreground">{PAYMENT_METHODS.find(p => p.value === form.payment_method)?.label}{form.credit_card_option ? ` (${CREDIT_CARD_OPTIONS.find(c => c.value === form.credit_card_option)?.label})` : ''}</p>
                      </div>
                    )}
                  </div>

                  {form.competitors.length > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">คู่แข่ง</span>
                      <p className="font-medium text-foreground">{form.competitors.join(', ')}</p>
                    </div>
                  )}

                  {form.notes && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">หมายเหตุ</span>
                      <p className="font-medium text-foreground">{form.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t pt-3 px-1">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
              <ChevronLeft size={14} /> ย้อนกลับ
            </Button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <Button size="sm" onClick={goNext} className="gap-1" disabled={step === 0 && !selectedCustomer}>
              ถัดไป <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave}>
              บันทึกโอกาสขาย
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

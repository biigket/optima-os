import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, Plus, ChevronLeft, ChevronRight, User, ClipboardList, CheckCircle2,
  MapPin, Calendar, Presentation, Users, Loader2, Briefcase, AlertCircle, Clock, X, UserPlus, AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMockAuth } from '@/hooks/useMockAuth';
import { cn } from '@/lib/utils';

// === Types ===

interface AccountInfo {
  id: string;
  clinic_name: string;
  address: string | null;
  phone: string | null;
  assigned_sale: string | null;
}

interface OpportunityInfo {
  id: string;
  stage: string;
  interested_products: string[] | null;
  expected_value: number | null;
  created_at: string;
}

interface ProductItem {
  id: string;
  product_name: string;
  category: string;
  base_price: number | null;
}

interface ContactItem {
  id: string;
  name: string;
  phone?: string | null;
  is_decision_maker?: boolean | null;
}

// === Constants ===

const DEMO_PRODUCTS = ['Doublo', 'Trica3D', 'Quattro', 'PicoHi'];
const PRODUCT_SPECIALISTS = ['Not', 'Ohm', 'Por'];

const TIME_OPTIONS = Array.from({ length: 4 * 24 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'นัดพบ/Need',
  CONTACTED: 'Demo Schedule',
  DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent',
  NEGOTIATION: 'Negotiation',
};

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

const STAGES = [
  { value: 'NEW_LEAD', label: 'นัดพบ/ค้นหา Need' },
  { value: 'CONTACTED', label: 'Demo Schedule' },
  { value: 'DEMO_SCHEDULED', label: 'Demo/Workshop' },
  { value: 'DEMO_DONE', label: 'Proposal Sent' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
];

const STEPS = [
  { key: 'customer', label: 'ลูกค้า', icon: User },
  { key: 'deal', label: 'ดีล', icon: Briefcase },
  { key: 'plan', label: 'รายละเอียด', icon: ClipboardList },
  { key: 'confirm', label: 'ยืนยัน', icon: CheckCircle2 },
] as const;

// === Step Indicator ===

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

// === MultiSelectWithCustom ===

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

// === Main Wizard ===

interface CreateDemoWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateDemoWizard({ open, onOpenChange, onSuccess }: CreateDemoWizardProps) {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const [step, setStep] = useState(0);

  // Step 0: customer
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);

  // Step 1: deal check
  const [existingDeals, setExistingDeals] = useState<OpportunityInfo[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);

  // New deal form fields
  const [dealProducts, setDealProducts] = useState<ProductItem[]>([]);
  const [dealContacts, setDealContacts] = useState<ContactItem[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [dealForm, setDealForm] = useState({
    selectedProductIds: [] as string[],
    deal_value: '',
    stage: 'CONTACTED' as string,
    close_date: '',
    notes: '',
    budget_range: '',
    payment_method: '',
    credit_card_option: '',
    competitors: [] as string[],
    authority_contact_id: '',
  });

  // Step 2: demo details
  const [demoDate, setDemoDate] = useState<Date | undefined>(undefined);
  const [demoLocation, setDemoLocation] = useState('');
  const [demoNote, setDemoNote] = useState('');
  const [selectedDemoProducts, setSelectedDemoProducts] = useState<string[]>([]);
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      resetAll();
      fetchAccounts();
    }
  }, [open]);

  function resetAll() {
    setStep(0);
    setSearch('');
    setSelectedAccount(null);
    setExistingDeals([]);
    setSelectedDealId(null);
    setShowNewDealForm(false);
    setDealForm({
      selectedProductIds: [], deal_value: ''CONTACTED', close_dateNTACONTACT: '', notes: '',
      budget_range: '', payment_method: '', credit_card_option: '', competitors: [],
      authority_contact_id: '',
    });
    setDealProducts([]);
    setDealContacts([]);
    setDemoDate(undefined);
    setDemoLocation('');
    setDemoNote('');
    setSelectedDemoProducts([]);
    setSelectedSpecialists([]);
    setStartTime('09:00');
    setEndTime('10:00');
  }

  async function fetchAccounts() {
    setLoadingAccounts(true);
    const { data } = await supabase
      .from('accounts')
      .select('id, clinic_name, address, phone, assigned_sale')
      .order('clinic_name');
    if (data) setAccounts(data);
    setLoadingAccounts(false);
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

  async function checkDealsForAccount(accountId: string) {
    setLoadingDeals(true);
    const { data } = await supabase
      .from('opportunities')
      .select('id, stage, interested_products, expected_value, created_at')
      .eq('account_id', accountId)
      .not('stage', 'in', '("WON","LOST")')
      .order('created_at', { ascending: false });

    const deals = (data || []) as OpportunityInfo[];
    setExistingDeals(deals);
    setLoadingDeals(false);

    if (deals.length === 1) {
      setSelectedDealId(deals[0].id);
    }
  }

  async function fetchDealFormData(accountId: string) {
    const [prodRes, conRes] = await Promise.all([
      supabase.from('products').select('id, product_name, category, base_price').eq('category', 'DEVICE'),
      supabase.from('contacts').select('id, name, phone, is_decision_maker').eq('account_id', accountId),
    ]);
    if (prodRes.data) setDealProducts(prodRes.data as ProductItem[]);
    if (conRes.data) setDealContacts(conRes.data as ContactItem[]);
  }

  function handleSelectCustomer(acc: AccountInfo) {
    setSelectedAccount(acc);
    setSelectedDealId(null);
    setExistingDeals([]);
    setShowNewDealForm(false);
    checkDealsForAccount(acc.id);
    setStep(1);
  }

  function handleCreateNewCustomer() {
    onOpenChange(false);
    navigate('/leads?action=create');
  }

  function handleStartNewDeal() {
    if (selectedAccount) fetchDealFormData(selectedAccount.id);
    setShowNewDealForm(true);
    setSelectedDealId(null);
  }

  const setDeal = (key: string, value: any) => setDealForm(f => ({ ...f, [key]: value }));

  function toggleDealProduct(id: string) {
    setDealForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(p => p !== id)
        : [...f.selectedProductIds, id],
    }));
  }

  async function handleAddContact() {
    if (!newContactName.trim() || !selectedAccount) return;
    const { data, error } = await supabase.from('contacts').insert({
      account_id: selectedAccount.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim() || null,
      is_decision_maker: true,
    }).select('id, name, phone, is_decision_maker').single();
    if (error) { toast.error('เพิ่มผู้ติดต่อไม่สำเร็จ'); return; }
    if (data) {
      const c = data as ContactItem;
      setDealContacts(prev => [...prev, c]);
      setDeal('authority_contact_id', c.id);
      toast.success('เพิ่มผู้ติดต่อแล้ว');
    }
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  }

  async function handleSaveNewDeal() {
    if (!selectedAccount) return;
    if (dealForm.selectedProductIds.length === 0 || !dealForm.deal_value) {
      toast.error('กรุณาเลือกสินค้าและระบุมูลค่าดีล');
      return;
    }

    setSavingDeal(true);
    const selectedProds = dealProducts.filter(p => dealForm.selectedProductIds.includes(p.id));
    const paymentMethodFull = dealForm.payment_method === 'CREDIT_CARD' && dealForm.credit_card_option
      ? `CREDIT_CARD:${dealForm.credit_card_option}` : dealForm.payment_method;

    const { data: newOpp, error } = await supabase
      .from('opportunities')
      .insert({
        account_id: selectedAccount.id,
        stage: dealForm.stage || 'CONTACTED',
        opportunity_type: 'DEVICE',
        interested_products: selectedProds.map(p => p.product_name),
        expected_value: Number(dealForm.deal_value),
        assigned_sale: selectedAccount.assigned_sale || currentUser?.name || null,
        close_date: dealForm.close_date || null,
        notes: dealForm.notes || null,
        budget_range: dealForm.budget_range || null,
        payment_method: paymentMethodFull || null,
        competitors: dealForm.competitors.join(', ') || null,
        authority_contact_id: dealForm.authority_contact_id || null,
      })
      .select('id, stage, interested_products, expected_value, created_at')
      .single();

    setSavingDeal(false);

    if (error) {
      toast.error('สร้างดีลไม่สำเร็จ');
      return;
    }

    if (newOpp) {
      const deal = newOpp as OpportunityInfo;
      setExistingDeals(prev => [deal, ...prev]);
      setSelectedDealId(deal.id);
      setShowNewDealForm(false);
      toast.success('สร้างดีลใหม่สำเร็จ');
    }
  }

  function toggleDemoProduct(name: string) {
    setSelectedDemoProducts(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  }

  function toggleSpecialist(name: string) {
    setSelectedSpecialists(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  }

  function goNext() {
    if (step === 0 && !selectedAccount) { toast.error('กรุณาเลือกลูกค้า'); return; }
    if (step === 1 && !selectedDealId) { toast.error('กรุณาเลือกดีล'); return; }
    if (step === 2) {
      if (!demoDate) { toast.error('กรุณาเลือกวันที่สาธิต'); return; }
      if (!demoLocation.trim()) { toast.error('กรุณาระบุสถานที่'); return; }
    }
    setStep(s => Math.min(s + 1, 3));
  }

  function goBack() {
    if (step === 1 && showNewDealForm) {
      setShowNewDealForm(false);
      return;
    }
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSave() {
    if (!selectedAccount || !demoDate || !selectedDealId) return;
    setSaving(true);

    const deal = existingDeals.find(d => d.id === selectedDealId);

    // Move opportunity to CONTACTED (Demo Schedule) if in earlier stage
    if (deal) {
      const earlyStages = ['NEW_LEAD'];
      if (earlyStages.includes(deal.stage)) {
        await supabase
          .from('opportunities')
          .update({ stage: 'CONTACTED' })
          .eq('id', selectedDealId);

        await supabase.from('opportunity_stage_history').insert({
          opportunity_id: selectedDealId,
          from_stage: deal.stage,
          to_stage: 'CONTACTED',
          changed_by: 'system (demo wizard)',
        });
      }
    }

    const visitedBy = selectedSpecialists.length > 0
      ? [...(currentUser ? [currentUser.name] : []), ...selectedSpecialists]
      : currentUser ? [currentUser.name] : null;

    const dateStr = format(demoDate, 'yyyy-MM-dd');

    // 1. Create demo record
    const { error: demoErr } = await supabase.from('demos').insert({
      account_id: selectedAccount.id,
      opportunity_id: selectedDealId,
      demo_date: dateStr,
      location: demoLocation || null,
      demo_note: demoNote || null,
      products_demo: selectedDemoProducts.length > 0 ? selectedDemoProducts : null,
      visited_by: visitedBy,
    });

    if (demoErr) {
      setSaving(false);
      toast.error('สร้างใบงานไม่สำเร็จ');
      return;
    }

    // 2. Create DEMO activity
    const descParts: string[] = [];
    if (demoLocation) descParts.push(`📍 สถานที่: ${demoLocation}`);
    if (selectedDemoProducts.length > 0) descParts.push(`🎯 สินค้า: ${selectedDemoProducts.join(', ')}`);
    if (selectedSpecialists.length > 0) descParts.push(`👤 Specialist: ${selectedSpecialists.join(', ')}`);
    if (demoLocation) descParts.push(`🗺️ Google Map: https://www.google.com/maps/search/${encodeURIComponent(demoLocation)}`);
    if (demoNote) descParts.push(`📝 ${demoNote}`);

    await supabase.from('activities').insert({
      opportunity_id: selectedDealId,
      account_id: selectedAccount.id,
      activity_type: 'DEMO',
      title: `นัดเดโม - ${selectedAccount.clinic_name}`,
      activity_date: dateStr,
      start_time: startTime,
      end_time: endTime,
      priority: 'HIGH',
      location: demoLocation || null,
      description: descParts.join('\n') || null,
      assigned_to: visitedBy,
      is_done: false,
      created_by: currentUser?.name || null,
    });

    setSaving(false);
    toast.success('สร้างใบงาน Demo + Activity เรียบร้อย');
    onSuccess();
    onOpenChange(false);
  }

  const selectedDeal = existingDeals.find(d => d.id === selectedDealId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>สร้างใบงานสาธิตสินค้า</DialogTitle>
          <DialogDescription className="sr-only">สร้างใบงาน Demo ใหม่</DialogDescription>
          {selectedAccount && step > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={14} />
              <span className="font-medium text-foreground">{selectedAccount.clinic_name}</span>
            </div>
          )}
        </DialogHeader>

        <StepIndicator currentStep={step} />

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
          {/* ===== STEP 0: Select Customer ===== */}
          {step === 0 && (
            <div className="space-y-3 flex-1 flex flex-col overflow-x-hidden">
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 px-1 min-h-0">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-muted-foreground" size={20} />
                  </div>
                ) : (
                  <>
                    {filtered.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => handleSelectCustomer(acc)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left border',
                          selectedAccount?.id === acc.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Building2 size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{acc.clinic_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {acc.address || '-'}
                            {acc.phone && ` • ${acc.phone}`}
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
              <div className="px-1">
                <button
                  onClick={handleCreateNewCustomer}
                  className="w-full flex items-center justify-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                >
                  <Plus size={14} /> สร้างลูกค้าใหม่
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 1: Deal Check / Create ===== */}
          {step === 1 && !showNewDealForm && (
            <div className="space-y-3 px-1">
              {loadingDeals ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <p className="text-xs text-muted-foreground">กำลังตรวจสอบดีล...</p>
                </div>
              ) : existingDeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertCircle size={32} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">ไม่พบดีลที่เปิดอยู่</p>
                  <p className="text-xs text-muted-foreground">กรุณาสร้างดีลใหม่เพื่อผูกกับใบงาน Demo</p>
                  <Button size="sm" onClick={handleStartNewDeal} className="gap-1.5">
                    <Plus size={14} /> สร้างดีลใหม่
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    พบ {existingDeals.length} ดีลที่เปิดอยู่ — เลือกดีลที่ต้องการผูกใบงาน Demo
                  </p>
                  <div className="space-y-2">
                    {existingDeals.map(deal => (
                      <button
                        key={deal.id}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-colors',
                          selectedDealId === deal.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {STAGE_LABELS[deal.stage] || deal.stage}
                            </span>
                          </div>
                          {deal.expected_value && (
                            <span className="text-xs text-muted-foreground">
                              ฿{deal.expected_value.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>สร้างเมื่อ {format(new Date(deal.created_at), 'd MMM yy', { locale: th })}</span>
                          {deal.interested_products && deal.interested_products.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{deal.interested_products.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleStartNewDeal}
                    className="w-full flex items-center justify-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                  >
                    <Plus size={14} /> สร้างดีลใหม่แทน
                  </button>
                </>
              )}
            </div>
          )}

          {/* ===== STEP 1b: Inline New Deal Form ===== */}
          {step === 1 && showNewDealForm && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 px-1 min-h-0">
              <div className="flex items-center gap-2 pb-1 border-b">
                <Briefcase size={14} className="text-primary" />
                <span className="text-sm font-semibold text-foreground">สร้างดีลใหม่</span>
              </div>

              {/* Authority Contact */}
              <div className="space-y-1.5">
                <Label className="text-xs">ผู้มีอำนาจตัดสินใจ</Label>
                {dealContacts.length === 0 && !showAddContact && (
                  <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-destructive">กรุณาเพิ่มผู้ติดต่อก่อน</p>
                    </div>
                  </div>
                )}
                <Select value={dealForm.authority_contact_id} onValueChange={v => {
                  if (v === '__add_new__') { setShowAddContact(true); return; }
                  setDeal('authority_contact_id', v);
                }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือกผู้มีอำนาจตัดสินใจ" /></SelectTrigger>
                  <SelectContent>
                    {dealContacts.map(c => (
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
                {dealForm.selectedProductIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {dealForm.selectedProductIds.map(id => {
                      const p = dealProducts.find(pr => pr.id === id);
                      return p ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {p.product_name}
                          <button onClick={() => toggleDealProduct(id)} className="hover:text-destructive"><X size={10} /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="border rounded-md p-2 space-y-1">
                  {dealProducts.length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">ไม่พบสินค้า</p>}
                  {dealProducts.map(p => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                      <Checkbox checked={dealForm.selectedProductIds.includes(p.id)} onCheckedChange={() => toggleDealProduct(p.id)} />
                      <span className="text-xs flex-1">{p.product_name}</span>
                      {p.base_price && <span className="text-xs text-muted-foreground">฿{p.base_price.toLocaleString()}</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Deal value */}
              <div className="space-y-1.5">
                <Label className="text-xs">มูลค่าดีล (฿) <span className="text-destructive">*</span></Label>
                <Input type="number" value={dealForm.deal_value} onChange={e => setDeal('deal_value', e.target.value)} className="h-9 text-xs" placeholder="0" />
              </div>

              {/* Stage */}
              <div className="space-y-1.5">
                <Label className="text-xs">ขั้นตอน</Label>
                <Select value={dealForm.stage} onValueChange={v => setDeal('stage', v)}>
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
                <Input type="date" value={dealForm.close_date} onChange={e => setDeal('close_date', e.target.value)} className="h-9 text-xs" />
              </div>

              {/* Additional info */}
              <div className="p-3 rounded-md border border-muted bg-muted/30 space-y-3">
                <p className="text-xs font-medium text-foreground">ข้อมูลเพิ่มเติม</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">งบประมาณลูกค้า</Label>
                    <Select value={dealForm.budget_range} onValueChange={v => setDeal('budget_range', v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map(b => <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ช่องทางชำระ</Label>
                    <Select value={dealForm.payment_method} onValueChange={v => { setDeal('payment_method', v); setDeal('credit_card_option', ''); }}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(p => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {dealForm.payment_method === 'CREDIT_CARD' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">เงื่อนไขบัตรเครดิต</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CREDIT_CARD_OPTIONS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setDeal('credit_card_option', c.value)}
                          className={cn(
                            'px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors',
                            dealForm.credit_card_option === c.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
                          )}
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
                  selected={dealForm.competitors}
                  onChange={t => setDeal('competitors', t)}
                  placeholder="เพิ่มคู่แข่งใหม่..."
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">หมายเหตุ</Label>
                <Textarea value={dealForm.notes} onChange={e => setDeal('notes', e.target.value)} className="text-xs min-h-[60px] resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
              </div>

              {/* Save deal button */}
              <Button
                className="w-full"
                size="sm"
                onClick={handleSaveNewDeal}
                disabled={savingDeal || dealForm.selectedProductIds.length === 0 || !dealForm.deal_value}
              >
                {savingDeal ? <><Loader2 size={14} className="animate-spin mr-1.5" /> กำลังสร้างดีล...</> : 'บันทึกดีล'}
              </Button>
            </div>
          )}

          {/* ===== STEP 2: Demo Details ===== */}
          {step === 2 && (
            <div className="space-y-4 px-1">
              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs">วันที่สาธิต <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start", !demoDate && "text-muted-foreground")}>
                      <Calendar className="mr-1.5 h-4 w-4" />
                      {demoDate ? format(demoDate, 'd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" selected={demoDate} onSelect={setDemoDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start / End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">เวลาเริ่ม</Label>
                  <Select value={startTime} onValueChange={v => {
                    setStartTime(v);
                    if (v >= endTime) {
                      const idx = TIME_OPTIONS.indexOf(v);
                      if (idx < TIME_OPTIONS.length - 1) setEndTime(TIME_OPTIONS[idx + 1]);
                    }
                  }}>
                    <SelectTrigger className="h-9 text-xs"><Clock size={12} className="mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">เวลาสิ้นสุด</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="h-9 text-xs"><Clock size={12} className="mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {TIME_OPTIONS.filter(t => t > startTime).map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label className="text-xs">สถานที่ <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="เช่น คลินิก, โรงพยาบาล..."
                  value={demoLocation}
                  onChange={e => setDemoLocation(e.target.value)}
                />
              </div>

              {/* Demo Products */}
              <div className="space-y-1.5">
                <Label className="text-xs">สินค้าที่สาธิต</Label>
                <div className="flex flex-wrap gap-2">
                  {DEMO_PRODUCTS.map(name => (
                    <label key={name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedDemoProducts.includes(name)}
                        onCheckedChange={() => toggleDemoProduct(name)}
                      />
                      <span className="text-xs">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Specialists */}
              <div className="space-y-1.5">
                <Label className="text-xs">Product Specialist</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_SPECIALISTS.map(name => (
                    <label key={name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedSpecialists.includes(name)}
                        onCheckedChange={() => toggleSpecialist(name)}
                      />
                      <span className="text-xs">{name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs">หมายเหตุ</Label>
                <Textarea
                  placeholder="รายละเอียดเพิ่มเติม..."
                  value={demoNote}
                  onChange={e => setDemoNote(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          )}

          {/* ===== STEP 3: Confirm ===== */}
          {step === 3 && (
            <div className="space-y-4 px-1">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Presentation size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedAccount?.clinic_name}</p>
                    <p className="text-xs text-muted-foreground">ใบงานสาธิตสินค้า</p>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2 text-sm">
                  {selectedDeal && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-xs">
                        ดีล: {STAGE_LABELS[selectedDeal.stage] || selectedDeal.stage}
                        {selectedDeal.expected_value ? ` • ฿${selectedDeal.expected_value.toLocaleString()}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">
                      {demoDate ? format(demoDate, 'd MMMM yyyy', { locale: th }) : '-'}
                      {' '}
                      <span className="text-muted-foreground font-normal">{startTime} - {endTime}</span>
                    </span>
                  </div>
                  {demoLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-muted-foreground shrink-0" />
                      <span>{demoLocation}</span>
                    </div>
                  )}
                  {(selectedSpecialists.length > 0 || currentUser) && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-muted-foreground shrink-0" />
                      <span>{[currentUser?.name, ...selectedSpecialists].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {selectedDemoProducts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Presentation size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {selectedDemoProducts.map(p => (
                          <span key={p} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {demoNote && (
                    <p className="text-xs text-muted-foreground pt-1 border-t">{demoNote}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                ระบบจะสร้างใบงาน Demo + Activity DEMO และเลื่อน Pipeline เป็น Demo Schedule อัตโนมัติ
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
              <ChevronLeft size={14} /> ย้อนกลับ
            </Button>
          ) : <div />}

          {/* Hide Next/Save when showing new deal form (has its own save button) */}
          {step === 1 && showNewDealForm ? (
            <div />
          ) : step < 3 ? (
            <Button
              size="sm"
              onClick={goNext}
              className="gap-1"
              disabled={step === 1 && (!selectedDealId || loadingDeals)}
            >
              ถัดไป <ChevronRight size={14} />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังสร้าง...' : 'สร้างใบงาน'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

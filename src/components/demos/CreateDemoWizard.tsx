import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Plus, ChevronLeft, ChevronRight, User, ClipboardList, CheckCircle2, MapPin, Calendar, Presentation, Users, Loader2, Briefcase, AlertCircle, Clock } from 'lucide-react';
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

const STEPS = [
  { key: 'customer', label: 'ลูกค้า', icon: User },
  { key: 'deal', label: 'ดีล', icon: Briefcase },
  { key: 'plan', label: 'รายละเอียด', icon: ClipboardList },
  { key: 'confirm', label: 'ยืนยัน', icon: CheckCircle2 },
] as const;

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
  const [creatingDeal, setCreatingDeal] = useState(false);

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

    if (deals.length === 0) {
      // No open deals — auto-create one
      await createNewDeal(accountId);
    } else if (deals.length === 1) {
      // Single deal — auto-select
      setSelectedDealId(deals[0].id);
    }
  }

  async function createNewDeal(accountId: string) {
    setCreatingDeal(true);
    const { data: newOpp, error } = await supabase
      .from('opportunities')
      .insert({
        account_id: accountId,
        stage: 'DEMO_SCHEDULED',
        opportunity_type: 'DEVICE',
        assigned_sale: selectedAccount?.assigned_sale || currentUser?.name || null,
      })
      .select('id, stage, interested_products, expected_value, created_at')
      .single();

    if (error) {
      toast.error('สร้างดีลอัตโนมัติไม่สำเร็จ');
      setCreatingDeal(false);
      return;
    }

    if (newOpp) {
      const deal = newOpp as OpportunityInfo;
      setExistingDeals([deal]);
      setSelectedDealId(deal.id);
      toast.success('สร้างดีลใหม่แล้ว → Demo Schedule');
    }
    setCreatingDeal(false);
  }

  function handleSelectCustomer(acc: AccountInfo) {
    setSelectedAccount(acc);
    setSelectedDealId(null);
    setExistingDeals([]);
    checkDealsForAccount(acc.id);
    setStep(1);
  }

  function handleCreateNewCustomer() {
    onOpenChange(false);
    navigate('/leads?action=create');
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
    if (step === 2 && !demoDate) { toast.error('กรุณาเลือกวันที่สาธิต'); return; }
    setStep(s => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSave() {
    if (!selectedAccount || !demoDate || !selectedDealId) return;
    setSaving(true);

    // Move opportunity to DEMO_SCHEDULED if in earlier stage
    const deal = existingDeals.find(d => d.id === selectedDealId);
    if (deal) {
      const earlyStages = ['NEW_LEAD', 'CONTACTED'];
      if (earlyStages.includes(deal.stage)) {
        await supabase
          .from('opportunities')
          .update({ stage: 'DEMO_SCHEDULED' })
          .eq('id', selectedDealId);

        await supabase.from('opportunity_stage_history').insert({
          opportunity_id: selectedDealId,
          from_stage: deal.stage,
          to_stage: 'DEMO_SCHEDULED',
          changed_by: 'system (demo wizard)',
        });
      }
    }

    const { error } = await supabase.from('demos').insert({
      account_id: selectedAccount.id,
      opportunity_id: selectedDealId,
      demo_date: format(demoDate, 'yyyy-MM-dd'),
      location: demoLocation || null,
      demo_note: demoNote || null,
      products_demo: selectedDemoProducts.length > 0 ? selectedDemoProducts : null,
      visited_by: selectedSpecialists.length > 0
        ? [...(currentUser ? [currentUser.name] : []), ...selectedSpecialists]
        : currentUser ? [currentUser.name] : null,
    });

    setSaving(false);
    if (error) {
      toast.error('สร้างใบงานไม่สำเร็จ');
      return;
    }

    toast.success('สร้างใบงานสาธิต + เลื่อน Pipeline เป็น Demo Schedule แล้ว');
    onSuccess();
    onOpenChange(false);
  }

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
          {/* STEP 0: Select Customer */}
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
              {/* Create new customer */}
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

          {/* STEP 1: Deal Check */}
          {step === 1 && (
            <div className="space-y-3 px-1">
              {loadingDeals || creatingDeal ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <p className="text-xs text-muted-foreground">
                    {creatingDeal ? 'กำลังสร้างดีลใหม่...' : 'กำลังตรวจสอบดีล...'}
                  </p>
                </div>
              ) : existingDeals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <AlertCircle size={32} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">ไม่พบดีลที่เปิดอยู่</p>
                  <Button size="sm" onClick={() => selectedAccount && createNewDeal(selectedAccount.id)} className="gap-1.5">
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
                    onClick={() => selectedAccount && createNewDeal(selectedAccount.id)}
                    className="w-full flex items-center justify-center gap-1.5 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
                  >
                    <Plus size={14} /> สร้างดีลใหม่แทน
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Demo Details */}
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

          {/* STEP 3: Confirm */}
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
                  {/* Deal info */}
                  {selectedDealId && (
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-muted-foreground shrink-0" />
                      <span className="text-xs">
                        ดีล: {STAGE_LABELS[existingDeals.find(d => d.id === selectedDealId)?.stage || ''] || 'ใหม่'}
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
                ระบบจะสร้างใบงาน Demo และเลื่อน Pipeline เป็น Demo Schedule อัตโนมัติ
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

          {step < 3 ? (
            <Button
              size="sm"
              onClick={goNext}
              className="gap-1"
              disabled={
                (step === 1 && (!selectedDealId || loadingDeals || creatingDeal))
              }
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

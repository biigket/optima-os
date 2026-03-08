import { useState, useEffect, useMemo } from 'react';
import { Search, Building2, Plus, ChevronLeft, ChevronRight, User, ClipboardList, CheckCircle2, MapPin, Calendar, Presentation, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMockAuth } from '@/hooks/useMockAuth';
import { ensureOpportunityForDemo } from '@/lib/demoSync';
import { cn } from '@/lib/utils';

interface AccountInfo {
  id: string;
  clinic_name: string;
  address: string | null;
  phone: string | null;
  assigned_sale: string | null;
}

interface Product {
  id: string;
  product_name: string;
  category: string;
}

const STEPS = [
  { key: 'customer', label: 'ลูกค้า', icon: User },
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
  const { currentUser } = useMockAuth();
  const [step, setStep] = useState(0);

  // Step 0: customer
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);

  // Step 1: details
  const [demoDate, setDemoDate] = useState<Date | undefined>(undefined);
  const [demoLocation, setDemoLocation] = useState('');
  const [demoNote, setDemoNote] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

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
    setDemoDate(undefined);
    setDemoLocation('');
    setDemoNote('');
    setSelectedProductIds([]);
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

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, product_name, category');
    if (data) setProducts(data);
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

  function handleSelectCustomer(acc: AccountInfo) {
    setSelectedAccount(acc);
    fetchProducts();
    setStep(1);
  }

  function toggleProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function goNext() {
    if (step === 0 && !selectedAccount) { toast.error('กรุณาเลือกลูกค้า'); return; }
    if (step === 1 && !demoDate) { toast.error('กรุณาเลือกวันที่สาธิต'); return; }
    setStep(s => Math.min(s + 1, 2));
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  async function handleSave() {
    if (!selectedAccount || !demoDate) return;
    setSaving(true);

    const oppId = await ensureOpportunityForDemo({
      accountId: selectedAccount.id,
      assignedSale: selectedAccount.assigned_sale || currentUser?.name,
    });

    const { error } = await supabase.from('demos').insert({
      account_id: selectedAccount.id,
      opportunity_id: oppId,
      demo_date: format(demoDate, 'yyyy-MM-dd'),
      location: demoLocation || null,
      demo_note: demoNote || null,
      products_demo: selectedProducts.length > 0 ? selectedProducts.map(p => p.product_name) : null,
      visited_by: currentUser ? [currentUser.name] : null,
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
                  <p className="text-center text-xs text-muted-foreground py-8">กำลังโหลด...</p>
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
            </div>
          )}

          {/* STEP 1: Demo Details */}
          {step === 1 && (
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
                <Label className="text-xs">สถานที่</Label>
                <Input
                  placeholder="เช่น คลินิก, โรงพยาบาล..."
                  value={demoLocation}
                  onChange={e => setDemoLocation(e.target.value)}
                />
              </div>

              {/* Products */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">สินค้าที่สาธิต</Label>
                  {selectedProductIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {selectedProducts.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {p.product_name}
                          <button onClick={() => toggleProduct(p.id)} className="hover:text-destructive">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="border rounded-md p-2 space-y-1">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox checked={selectedProductIds.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                        <span className="text-xs">{p.product_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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

          {/* STEP 2: Confirm */}
          {step === 2 && (
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
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground shrink-0" />
                    <span className="font-medium">{demoDate ? format(demoDate, 'd MMMM yyyy', { locale: th }) : '-'}</span>
                  </div>
                  {demoLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-muted-foreground shrink-0" />
                      <span>{demoLocation}</span>
                    </div>
                  )}
                  {currentUser && (
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-muted-foreground shrink-0" />
                      <span>{currentUser.name}</span>
                    </div>
                  )}
                  {selectedProducts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Presentation size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {selectedProducts.map(p => (
                          <span key={p.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{p.product_name}</span>
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

          {step < 2 ? (
            <Button size="sm" onClick={goNext} className="gap-1">
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

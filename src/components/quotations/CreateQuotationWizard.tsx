import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Building2, Plus, ChevronLeft, ChevronRight, User, Package, CheckCircle2,
  FileText, Trash2, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QuickNoteButtons from '@/components/ui/QuickNoteButtons';

// === Constants ===

const SELLER_INFO = {
  company: 'บริษัท ออปติม่าแอสเทติค จำกัด',
  address: '65 ถนน วิชิตสงคราม ตำบลตลาดเหนือ อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000',
  taxId: '0835563001787',
  phone: '0828120999',
  email: 'info@optimaaesthetic.co.th',
  website: 'www.optimaaesthetic.com',
};

const MOCK_PRODUCTS = [
  { name: 'Doublo Neo', price: 720000 },
  { name: 'Doublo Full 3', price: 1220000 },
  { name: 'Doublo Full 5', price: 1620000 },
  { name: 'Trica3D', price: 420000 },
  { name: 'Quattro', price: 420000 },
  { name: 'PicoHi', price: 2500000 },
];

const DEFAULT_SALES_TERMS = [
  'ราคานี้รวม VAT 7% แล้ว',
  'ราคานี้ยังไม่รวม VAT 7%',
  'รับประกันเครื่อง 1 ปี',
  'รับประกันเครื่อง 2 ปี',
  'ฟรีติดตั้งและสอนการใช้งาน',
  'ชำระเงินภายใน 30 วัน',
  'มัดจำ 50% ก่อนส่งมอบ',
];

interface AccountInfo {
  id: string;
  clinic_name: string;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
}

interface ContactItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface ProductLine {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

// Steps
const STEPS = [
  { key: 'customer', label: 'ลูกค้า', icon: User },
  { key: 'products', label: 'สินค้า', icon: Package },
  { key: 'details', label: 'รายละเอียด', icon: FileText },
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

function generateQTNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `QT-${year}-${month}${day}${rand}`;
}

// === Main Wizard ===

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function CreateQuotationWizard({ open, onOpenChange, onCreated }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0: Customer
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  // Customer override fields (for when account data is incomplete)
  const [customerOverride, setCustomerOverride] = useState({
    clinic_name: '',
    address: '',
    tax_id: '',
    contact_name: '',
    phone: '',
    email: '',
  });

  // Step 1: Products
  const [productLines, setProductLines] = useState<ProductLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [includeVat, setIncludeVat] = useState(true);

  // Step 2: Details
  const [qtNumber, setQtNumber] = useState('');
  const [qtDate, setQtDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validityDays] = useState(30);
  const [salesTerms, setSalesTerms] = useState('');
  const [saleAssigned, setSaleAssigned] = useState('');
  const [paymentCondition, setPaymentCondition] = useState('CASH');

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
    setContacts([]);
    setSelectedContactId(null);
    setCustomerOverride({ clinic_name: '', address: '', tax_id: '', contact_name: '', phone: '', email: '' });
    setProductLines([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setQtNumber(generateQTNumber());
    setQtDate(format(new Date(), 'yyyy-MM-dd'));
    setSalesTerms('');
    setSaleAssigned('');
    setPaymentCondition('CASH');
  }

  async function fetchAccounts() {
    const { data } = await supabase
      .from('accounts')
      .select('id, clinic_name, company_name, address, phone, email, tax_id')
      .order('clinic_name');
    if (data) setAccounts(data);
  }

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      a.clinic_name.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q) ||
      a.phone?.includes(q)
    );
  }, [accounts, search]);

  async function handleSelectAccount(acc: AccountInfo) {
    setSelectedAccount(acc);
    setCustomerOverride({
      clinic_name: acc.company_name || acc.clinic_name,
      address: acc.address || '',
      tax_id: acc.tax_id || '',
      contact_name: '',
      phone: acc.phone || '',
      email: acc.email || '',
    });
    // Fetch contacts
    const { data } = await supabase
      .from('contacts')
      .select('id, name, phone, email')
      .eq('account_id', acc.id)
      .order('name');
    if (data && data.length > 0) {
      setContacts(data);
      const dm = data[0];
      setSelectedContactId(dm.id);
      setCustomerOverride(prev => ({
        ...prev,
        contact_name: dm.name,
        phone: dm.phone || prev.phone,
        email: dm.email || prev.email,
      }));
    }
  }

  function handleContactChange(contactId: string) {
    setSelectedContactId(contactId);
    const c = contacts.find(x => x.id === contactId);
    if (c) {
      setCustomerOverride(prev => ({
        ...prev,
        contact_name: c.name,
        phone: c.phone || prev.phone,
        email: c.email || prev.email,
      }));
    }
  }

  // Product line management
  function addProduct(name: string, price: number) {
    const exists = productLines.find(p => p.name === name);
    if (exists) {
      toast.error('สินค้านี้ถูกเพิ่มแล้ว');
      return;
    }
    setProductLines(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      qty: 1,
      unitPrice: price,
    }]);
  }

  function removeProduct(id: string) {
    setProductLines(prev => prev.filter(p => p.id !== id));
  }

  function updateProductQty(id: string, qty: number) {
    setProductLines(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, qty) } : p));
  }

  function updateProductPrice(id: string, price: number) {
    setProductLines(prev => prev.map(p => p.id === id ? { ...p, unitPrice: price } : p));
  }

  // Calculations
  const subtotal = productLines.reduce((sum, p) => sum + p.qty * p.unitPrice, 0);
  const discountFromPercent = Math.round(subtotal * discountPercent / 100);
  const discount = discountFromPercent + discountAmount;
  const netPrice = subtotal - discount;
  const vat = includeVat ? Math.round(netPrice * 0.07) : 0;
  const grandTotal = netPrice + vat;

  const expiryDate = qtDate ? format(addDays(new Date(qtDate), validityDays), 'yyyy-MM-dd') : '';

  function goNext() {
    if (step === 0 && !selectedAccount) { toast.error('กรุณาเลือกลูกค้า'); return; }
    if (step === 1 && productLines.length === 0) { toast.error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'); return; }
    setStep(s => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSave() {
    if (!selectedAccount) return;
    setSaving(true);

    const productName = productLines.map(p => `${p.name} x${p.qty}`).join(', ');

    const { error } = await supabase.from('quotations').insert({
      qt_number: qtNumber || null,
      account_id: selectedAccount.id,
      product: productName,
      price: grandTotal,
      qt_date: qtDate || null,
      payment_condition: paymentCondition || null,
      sale_assigned: saleAssigned || null,
      approval_status: 'DRAFT',
      payment_status: 'UNPAID',
    });

    setSaving(false);
    if (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }
    toast.success('สร้างใบเสนอราคาสำเร็จ');
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAll(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างใบเสนอราคา</DialogTitle>
          <DialogDescription>กรอกข้อมูลเพื่อสร้างใบเสนอราคาใหม่</DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        {/* Step 0: Customer Selection */}
        {step === 0 && (
          <div className="space-y-4">
            {!selectedAccount ? (
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาชื่อ, ที่อยู่, เบอร์โทร..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-2 max-h-[340px] overflow-y-auto">
                  {filteredAccounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2 size={18} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">{acc.clinic_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {[acc.address, acc.phone].filter(Boolean).join(' • ') || 'ไม่มีข้อมูลเพิ่มเติม'}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <div className="text-center py-6 text-sm text-muted-foreground">ไม่พบลูกค้า</div>
                  )}
                </div>
                <button
                  onClick={() => { onOpenChange(false); navigate('/leads?action=create'); }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 transition-colors text-sm"
                >
                  <Plus size={14} /> สร้างลูกค้าใหม่
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <Building2 size={18} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{selectedAccount.clinic_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{selectedAccount.address}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedAccount(null); setContacts([]); }}>
                    เปลี่ยน
                  </Button>
                </div>

                <Separator />
                <p className="text-xs font-medium text-muted-foreground">ข้อมูลลูกค้าในใบเสนอราคา</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">ชื่อบริษัท / คลินิก</Label>
                    <Input value={customerOverride.clinic_name} onChange={e => setCustomerOverride(p => ({ ...p, clinic_name: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">ที่อยู่</Label>
                    <Textarea value={customerOverride.address} onChange={e => setCustomerOverride(p => ({ ...p, address: e.target.value }))} className="text-sm min-h-[60px]" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">เลขผู้เสียภาษี</Label>
                    <Input value={customerOverride.tax_id} onChange={e => setCustomerOverride(p => ({ ...p, tax_id: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ผู้ติดต่อ</Label>
                    {contacts.length > 0 ? (
                      <select
                        value={selectedContactId || ''}
                        onChange={e => handleContactChange(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Input value={customerOverride.contact_name} onChange={e => setCustomerOverride(p => ({ ...p, contact_name: e.target.value }))} className="h-9 text-sm" placeholder="ชื่อผู้ติดต่อ" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">เบอร์โทร</Label>
                    <Input value={customerOverride.phone} onChange={e => setCustomerOverride(p => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input value={customerOverride.email} onChange={e => setCustomerOverride(p => ({ ...p, email: e.target.value }))} className="h-9 text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Products */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">เลือกสินค้าจากรายการ</Label>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_PRODUCTS.map(p => {
                  const added = productLines.some(l => l.name === p.name);
                  return (
                    <button
                      key={p.name}
                      onClick={() => !added && addProduct(p.name, p.price)}
                      disabled={added}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        added
                          ? 'bg-primary/10 text-primary border-primary/30 cursor-not-allowed'
                          : 'bg-background text-foreground border-input hover:border-primary/50 hover:bg-muted/30'
                      )}
                    >
                      {added ? '✓ ' : '+ '}{p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {productLines.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">สินค้า</TableHead>
                      <TableHead className="text-xs text-center w-20">จำนวน</TableHead>
                      <TableHead className="text-xs text-right w-32">ราคาต่อหน่วย</TableHead>
                      <TableHead className="text-xs text-right w-28">รวม</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productLines.map((line, i) => (
                      <TableRow key={line.id}>
                        <TableCell className="text-sm font-medium">{line.name}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={e => updateProductQty(line.id, Number(e.target.value))}
                            className="h-8 text-sm text-center w-16 mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={line.unitPrice}
                            onChange={e => updateProductPrice(line.id, Number(e.target.value))}
                            className="h-8 text-sm text-right w-28 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          ฿{(line.qty * line.unitPrice).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeProduct(line.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {productLines.length > 0 && (
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">ส่วนลด</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={e => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="h-8 text-sm text-right w-20"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    className="h-8 text-sm text-right w-32"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Price</span>
                  <span className="font-medium">฿{netPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeVat} onChange={e => setIncludeVat(e.target.checked)} className="rounded border-input" />
                    <span className="text-muted-foreground">VAT 7%</span>
                  </label>
                  <span className="font-medium">{includeVat ? `฿${vat.toLocaleString()}` : '-'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">฿{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Seller Info (read-only) */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">ข้อมูลผู้ขาย</p>
              <p className="text-sm font-medium">{SELLER_INFO.company}</p>
              <p className="text-xs text-muted-foreground">{SELLER_INFO.address}</p>
              <p className="text-xs text-muted-foreground">Tax ID: {SELLER_INFO.taxId} | โทร: {SELLER_INFO.phone}</p>
              <p className="text-xs text-muted-foreground">{SELLER_INFO.email} | {SELLER_INFO.website}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">เลขที่ใบเสนอราคา</Label>
                <Input value={qtNumber} onChange={e => setQtNumber(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">วันที่ออกเอกสาร</Label>
                <Input type="date" value={qtDate} onChange={e => setQtDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">วันหมดอายุ (30 วัน)</Label>
                <Input value={expiryDate} readOnly className="h-9 text-sm bg-muted/30" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">เซลล์ผู้รับผิดชอบ</Label>
                <Input value={saleAssigned} onChange={e => setSaleAssigned(e.target.value)} className="h-9 text-sm" placeholder="ชื่อเซลล์" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">เงื่อนไขการชำระเงิน</Label>
              <select
                value={paymentCondition}
                onChange={e => setPaymentCondition(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="CASH">เงินสด</option>
                <option value="INSTALLMENT">ผ่อนชำระ</option>
                <option value="LEASING">ลีสซิ่ง</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">เงื่อนไขการขาย (Sales Terms)</Label>
              <QuickNoteButtons
                value={salesTerms}
                onChange={setSalesTerms}
                storageKey="qt-sales-terms"
                defaults={DEFAULT_SALES_TERMS}
              />
              <Textarea
                value={salesTerms}
                onChange={e => setSalesTerms(e.target.value)}
                placeholder="ระบุเงื่อนไขเพิ่มเติม..."
                className="text-sm min-h-[80px] mt-2"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 text-sm">
            {/* Seller */}
            <div className="bg-muted/20 rounded-lg p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">ผู้ขาย</p>
              <p className="font-medium">{SELLER_INFO.company}</p>
              <p className="text-xs text-muted-foreground">{SELLER_INFO.phone} | {SELLER_INFO.email}</p>
            </div>

            {/* Document */}
            <div className="grid grid-cols-3 gap-3 bg-muted/20 rounded-lg p-3">
              <div>
                <p className="text-xs text-muted-foreground">เลขที่</p>
                <p className="font-medium">{qtNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">วันที่</p>
                <p className="font-medium">{qtDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">หมดอายุ</p>
                <p className="font-medium">{expiryDate}</p>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-muted/20 rounded-lg p-3 space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">ลูกค้า</p>
              <p className="font-medium">{customerOverride.clinic_name}</p>
              <p className="text-xs text-muted-foreground">{customerOverride.address}</p>
              {customerOverride.tax_id && <p className="text-xs text-muted-foreground">Tax ID: {customerOverride.tax_id}</p>}
              <p className="text-xs text-muted-foreground">
                {[customerOverride.contact_name, customerOverride.phone, customerOverride.email].filter(Boolean).join(' | ')}
              </p>
            </div>

            {/* Products */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">สินค้า</TableHead>
                    <TableHead className="text-xs text-center">จำนวน</TableHead>
                    <TableHead className="text-xs text-right">ราคา</TableHead>
                    <TableHead className="text-xs text-right">รวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productLines.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.name}</TableCell>
                      <TableCell className="text-center text-sm">{p.qty}</TableCell>
                      <TableCell className="text-right text-sm">฿{p.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-medium">฿{(p.qty * p.unitPrice).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="space-y-1.5 bg-muted/30 rounded-lg p-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>฿{subtotal.toLocaleString()}</span></div>
              {discount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-฿{discount.toLocaleString()}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Net Price</span><span>฿{netPrice.toLocaleString()}</span></div>
              {includeVat && <div className="flex justify-between"><span className="text-muted-foreground">VAT 7%</span><span>฿{vat.toLocaleString()}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span className="text-primary">฿{grandTotal.toLocaleString()}</span></div>
            </div>

            {/* Terms */}
            {salesTerms && (
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">เงื่อนไขการขาย</p>
                <p className="text-sm whitespace-pre-wrap">{salesTerms}</p>
              </div>
            )}

            {saleAssigned && (
              <div className="text-xs text-muted-foreground">เซลล์: {saleAssigned} | เงื่อนไขชำระ: {paymentCondition === 'CASH' ? 'เงินสด' : paymentCondition === 'INSTALLMENT' ? 'ผ่อนชำระ' : 'ลีสซิ่ง'}</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={step === 0 ? () => onOpenChange(false) : goBack} className="gap-1.5">
            {step === 0 ? 'ยกเลิก' : <><ChevronLeft size={14} /> ย้อนกลับ</>}
          </Button>
          {step < 3 ? (
            <Button onClick={goNext} className="gap-1.5">
              ถัดไป <ChevronRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'สร้างใบเสนอราคา'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { ExternalLink, Users, AlertTriangle, X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Account, OpportunityStage, Opportunity } from '@/types';
import { differenceInDays } from 'date-fns';

const STAGE_PROBABILITY: Record<string, number> = {
  NEW_LEAD: 10, CONTACTED: 20, DEMO_SCHEDULED: 40, DEMO_DONE: 60,
  NEGOTIATION: 75, WON: 100, LOST: 0,
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
  customer: Account;
  onSave: (data: Opportunity) => void;
}

const DEFAULT_COMPETITORS = ['Ultherapy', 'Thermage', 'HIFU (อื่นๆ)', 'Sofwave', 'Morpheus8'];
const DEFAULT_CURRENT_DEVICES = ['Doublo Gold', 'Ultraformer III', 'HIFU เก่า', 'Thermage FLX', 'Profound Matrix'];

function MultiSelectWithCustom({ label, options: defaultOptions, selected, onChange, placeholder }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [customInput, setCustomInput] = useState('');
  const [allOptions, setAllOptions] = useState(defaultOptions);

  useEffect(() => {
    // Ensure selected items that aren't in defaults are added to options
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
      <div className="border rounded-md max-h-[120px] overflow-y-auto p-2 space-y-1">
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

export default function CreateOpportunityForm({ open, onOpenChange, customer, onSave }: CreateOpportunityFormProps) {
  const navigate = useNavigate();
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
    current_devices: [] as string[],
    authority_contact_id: '',
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('products').select('id, product_name, category, base_price').eq('category', 'DEVICE'),
      supabase.from('contacts').select('id, account_id, name, phone, is_decision_maker').eq('account_id', customer.id),
    ]).then(([prodRes, conRes]) => {
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (conRes.data) setContacts(conRes.data as ContactItem[]);
    });
  }, [open, customer.id]);

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

  useEffect(() => {
    const stageProbability = STAGE_PROBABILITY[currentStage] ?? 10;
    set('probability', stageProbability);
  }, [currentStage]);

  const closeDateDays = form.close_date
    ? differenceInDays(new Date(form.close_date), new Date())
    : null;

  const canSave = form.selectedProductIds.length > 0 && !!form.deal_value;

  const handleAddContact = async () => {
    if (!newContactName.trim()) return;
    const { data, error } = await supabase.from('contacts').insert({
      account_id: customer.id,
      name: newContactName.trim(),
      phone: newContactPhone.trim() || null,
      is_decision_maker: true,
    }).select('id, account_id, name, phone, is_decision_maker').single();
    if (error) { toast.error('เพิ่มผู้ติดต่อไม่สำเร็จ'); return; }
    if (data) {
      const newContact = data as ContactItem;
      setContacts(prev => [...prev, newContact]);
      set('authority_contact_id', newContact.id);
      toast.success('เพิ่มผู้ติดต่อแล้ว');
    }
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleSave = () => {
    const selectedProducts = products.filter(p => form.selectedProductIds.includes(p.id));

    const paymentMethodFull = form.payment_method === 'CREDIT_CARD' && form.credit_card_option
      ? `CREDIT_CARD:${form.credit_card_option}`
      : form.payment_method;

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      account_id: customer.id,
      stage: currentStage as OpportunityStage,
      opportunity_type: 'DEVICE',
      interested_products: selectedProducts.map(p => p.product_name),
      expected_value: Number(form.deal_value),
      assigned_sale: customer.assigned_sale || undefined,
      close_date: form.close_date || undefined,
      notes: form.notes || undefined,
      budget_range: form.budget_range || undefined,
      payment_method: paymentMethodFull || undefined,
      competitors: form.competitors.join(', ') || undefined,
      current_devices: form.current_devices.join(', ') || undefined,
      authority_contact_id: form.authority_contact_id || undefined,
      needs: undefined,
      created_at: new Date().toISOString(),
    };

    onSave(newOpp);
    toast.success('สร้างโอกาสขายสำเร็จ');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => setForm({
    selectedProductIds: [], deal_value: '',
    stage: '', close_date: '', notes: '',
    budget_range: '', payment_method: '', credit_card_option: '',
    competitors: [], current_devices: [],
    authority_contact_id: '',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-0">
          <DialogDescription className="sr-only">สร้างโอกาสขายใหม่</DialogDescription>
          <div className="sticky top-0 z-10 bg-muted/60 border-b px-5 py-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-sm font-bold text-foreground">{customer.clinic_name}</DialogTitle>
              <StatusBadge status={customer.customer_status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>🧑‍💼 {customer.assigned_sale || '-'}</span>
              <span className="flex items-center gap-1"><Users size={10} /> {contacts.length} ผู้ติดต่อ</span>
              <button
                onClick={() => navigate(`/leads/${customer.id}`)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink size={10} /> ดูรายละเอียด
              </button>
            </div>
          </div>
        </DialogHeader>

        {contacts.length === 0 && !showAddContact && (
          <div className="mx-5 mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-destructive">กรุณาเพิ่มผู้ติดต่อก่อนสร้างโอกาสขาย</p>
              <p className="text-muted-foreground mt-0.5">ลูกค้ารายนี้ยังไม่มีผู้ติดต่อในระบบ</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Authority (คนมีอำนาจตัดสินใจ) */}
          <div className="space-y-1.5">
            <Label className="text-xs">ผู้มีอำนาจตัดสินใจ (Authority)</Label>
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
            {form.authority_contact_id && (() => {
              const sel = contacts.find(c => c.id === form.authority_contact_id);
              return sel?.phone ? (
                <p className="text-[10px] text-muted-foreground">📞 {sel.phone}</p>
              ) : null;
            })()}

            {/* Inline add contact */}
            {showAddContact && (
              <div className="p-3 rounded-md border border-primary/20 bg-primary/5 space-y-2">
                <p className="text-xs font-medium text-foreground">เพิ่มผู้ติดต่อใหม่</p>
                <Input
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="ชื่อผู้ติดต่อ *"
                />
                <Input
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="เบอร์โทร"
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="h-7 text-xs" onClick={handleAddContact} disabled={!newContactName.trim()}>
                    บันทึก
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAddContact(false)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}
          </div>


          {/* สินค้า Multi-select (DEVICE only) */}
          <div className="space-y-1.5">
            <Label className="text-xs">สินค้า <span className="text-destructive">*</span> <span className="text-muted-foreground">(เลือกได้หลายรายการ)</span></Label>
            {form.selectedProductIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
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
            <div className="border rounded-md max-h-[140px] overflow-y-auto p-2 space-y-1">
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">ไม่พบสินค้า</p>
              )}
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={form.selectedProductIds.includes(p.id)}
                    onCheckedChange={() => toggleProduct(p.id)}
                  />
                  <span className="text-xs flex-1">{p.product_name}</span>
                  {p.base_price && <span className="text-xs text-muted-foreground">฿{p.base_price.toLocaleString()}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* มูลค่าดีล */}
          <div className="space-y-1.5">
            <Label className="text-xs">มูลค่าดีล (฿) <span className="text-destructive">*</span></Label>
            <Input type="number" value={form.deal_value} onChange={e => set('deal_value', e.target.value)} className="h-9 text-xs" placeholder="0" />
          </div>

          {/* Stage + Probability */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ขั้นตอน</Label>
                <Select value={currentStage} onValueChange={v => set('stage', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {([
                      { value: 'NEW_LEAD', label: 'นัดพบ/ค้นหา Need' },
                      { value: 'CONTACTED', label: 'Demo Schedule' },
                      { value: 'DEMO_SCHEDULED', label: 'Demo/Workshop' },
                      { value: 'DEMO_DONE', label: 'Proposal Sent' },
                      { value: 'NEGOTIATION', label: 'Negotiation' },
                    ]).map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Probability: {form.probability}%</Label>
                <div className="pt-2 px-1">
                  <Slider
                    value={[form.probability]}
                    onValueChange={([v]) => set('probability', v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* วันปิดคาดการณ์ + ระยะเวลา */}
          <div className="space-y-1.5">
            <Label className="text-xs">วันปิดคาดการณ์</Label>
            <Input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} className="h-9 text-xs" />
            {closeDateDays !== null && (
              <p className={`text-[10px] font-medium ${closeDateDays >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {closeDateDays >= 0 ? `อีก ${closeDateDays} วัน` : `เลยกำหนด ${Math.abs(closeDateDays)} วัน`}
              </p>
            )}
          </div>

          {/* ข้อมูลเพิ่มเติม */}
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

            {/* คู่แข่ง — tag chips */}
            <TagChipInput
              label="คู่แข่งที่เปรียบเทียบ"
              tags={form.competitors}
              onChange={t => set('competitors', t)}
              placeholder="เช่น Ultherapy, Thermage..."
            />

            {/* เครื่องปัจจุบัน — tag chips */}
            <TagChipInput
              label="เครื่องที่ใช้อยู่ปัจจุบัน"
              tags={form.current_devices}
              onChange={t => set('current_devices', t)}
              placeholder="เช่น Doublo Gold, HIFU เก่า..."
            />
          </div>

          {/* หมายเหตุ */}
          <div className="space-y-1.5">
            <Label className="text-xs">หมายเหตุ</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="text-xs min-h-[60px] resize-none" placeholder="รายละเอียดเพิ่มเติม..." />
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave || contacts.length === 0}>
            บันทึกโอกาสขาย
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { ExternalLink, Users, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Account, OpportunityType, OpportunityStage, Opportunity } from '@/types';

const STAGE_PROBABILITY: Record<string, number> = {
  NEW_LEAD: 10, CONTACTED: 20, DEMO_SCHEDULED: 40, DEMO_DONE: 60,
  NEGOTIATION: 75, WON: 100, LOST: 0,
};

const ACTIVITY_TYPES = [
  { value: 'CALL', label: 'โทร' },
  { value: 'VISIT', label: 'เยี่ยม' },
  { value: 'DEMO', label: 'สาธิต' },
  { value: 'MEETING', label: 'ประชุม' },
  { value: 'LINE', label: 'LINE' },
  { value: 'EMAIL', label: 'อีเมล' },
];

const BUDGET_RANGES = [
  { value: '<1M', label: 'ต่ำกว่า 1M' },
  { value: '1-3M', label: '1-3M' },
  { value: '3-5M', label: '3-5M' },
  { value: '5M+', label: '5M+' },
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

const ORDER_FREQUENCIES = [
  { value: 'WEEKLY', label: 'รายสัปดาห์' },
  { value: 'MONTHLY', label: 'รายเดือน' },
  { value: 'QUARTERLY', label: 'รายไตรมาส' },
];

interface Product {
  id: string;
  product_name: string;
  category: string;
  base_price: number | null;
}

interface Contact {
  id: string;
  account_id: string;
  name: string;
}

interface CreateOpportunityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Account;
  onSave: (data: Opportunity) => void;
}

export default function CreateOpportunityForm({ open, onOpenChange, customer, onSave }: CreateOpportunityFormProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [form, setForm] = useState({
    opportunity_type: '' as OpportunityType | '',
    selectedProductIds: [] as string[],
    deal_value: '',
    quantity: '',
    stage: '' as OpportunityStage | '',
    probability: 10,
    close_date: '',
    notes: '',
    next_activity_type: '',
    next_activity_date: '',
    budget_range: '',
    payment_method: '',
    credit_card_option: '',
    competitors: '',
    current_devices: '',
    order_frequency: '',
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('products').select('id, product_name, category, base_price'),
      supabase.from('contacts').select('id, account_id, name').eq('account_id', customer.id),
    ]).then(([prodRes, conRes]) => {
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (conRes.data) setContacts(conRes.data as Contact[]);
    });
  }, [open, customer.id]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const filteredProducts = products.filter(p =>
    !form.opportunity_type || p.category === form.opportunity_type
  );

  const toggleProduct = (id: string) => {
    setForm(f => ({
      ...f,
      selectedProductIds: f.selectedProductIds.includes(id)
        ? f.selectedProductIds.filter(p => p !== id)
        : [...f.selectedProductIds, id],
    }));
  };

  const autoStage = form.opportunity_type === 'CONSUMABLE' ? 'CONTACTED' : 'NEW_LEAD';
  const currentStage = form.stage || autoStage;

  // Auto-update probability when stage changes
  useEffect(() => {
    const stageProbability = STAGE_PROBABILITY[currentStage] ?? 10;
    set('probability', stageProbability);
  }, [currentStage]);

  const canSave = form.opportunity_type && form.selectedProductIds.length > 0 && form.next_activity_type && form.next_activity_date &&
    (form.opportunity_type === 'DEVICE' ? !!form.deal_value : !!form.quantity);

  const handleSave = () => {
    const selectedProducts = products.filter(p => form.selectedProductIds.includes(p.id));
    const expectedValue = form.opportunity_type === 'DEVICE'
      ? Number(form.deal_value)
      : Number(form.quantity) * (selectedProducts.reduce((sum, p) => sum + (p.base_price || 0), 0) / selectedProducts.length || 0);

    const paymentMethodFull = form.payment_method === 'CREDIT_CARD' && form.credit_card_option
      ? `CREDIT_CARD:${form.credit_card_option}`
      : form.payment_method;

    const newOpp: Opportunity = {
      id: `opp-${Date.now()}`,
      account_id: customer.id,
      stage: currentStage as OpportunityStage,
      opportunity_type: form.opportunity_type || undefined,
      interested_products: selectedProducts.map(p => p.product_name),
      expected_value: expectedValue,
      assigned_sale: customer.assigned_sale || undefined,
      close_date: form.close_date || undefined,
      next_activity_type: form.next_activity_type || undefined,
      next_activity_date: form.next_activity_date || undefined,
      notes: form.notes || undefined,
      probability: form.probability,
      budget_range: form.budget_range || undefined,
      payment_method: paymentMethodFull || undefined,
      competitors: form.competitors || undefined,
      current_devices: form.current_devices || undefined,
      order_frequency: form.order_frequency || undefined,
      created_at: new Date().toISOString(),
      quantity: form.quantity ? Number(form.quantity) : undefined,
    };

    onSave(newOpp);
    toast.success('สร้างโอกาสขายสำเร็จ');
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => setForm({
    opportunity_type: '', selectedProductIds: [], deal_value: '', quantity: '',
    stage: '', probability: 10, close_date: '', notes: '',
    next_activity_type: '', next_activity_date: '',
    budget_range: '', payment_method: '', credit_card_option: '',
    competitors: '', current_devices: '', order_frequency: '',
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

        {contacts.length === 0 && (
          <div className="mx-5 mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-destructive">กรุณาเพิ่มผู้ติดต่อก่อนสร้างโอกาสขาย</p>
              <p className="text-muted-foreground mt-0.5">ลูกค้ารายนี้ยังไม่มีผู้ติดต่อในระบบ</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* ประเภท */}
          <div className="space-y-1.5">
            <Label className="text-xs">ประเภท <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(['DEVICE', 'CONSUMABLE'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { set('opportunity_type', t); set('selectedProductIds', []); set('stage', ''); }}
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition-colors ${form.opportunity_type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`}
                >
                  {t === 'DEVICE' ? '🔧 เครื่องมือ' : '📦 สิ้นเปลือง'}
                </button>
              ))}
            </div>
          </div>

          {/* สินค้า Multi-select */}
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
              {filteredProducts.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  {form.opportunity_type ? 'ไม่พบสินค้าในหมวดนี้' : 'กรุณาเลือกประเภทก่อน'}
                </p>
              )}
              {filteredProducts.map(p => (
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

          {/* มูลค่าดีล / จำนวน */}
          {form.opportunity_type === 'DEVICE' && (
            <div className="space-y-1.5">
              <Label className="text-xs">มูลค่าดีล (฿) <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.deal_value} onChange={e => set('deal_value', e.target.value)} className="h-9 text-xs" placeholder="0" />
            </div>
          )}
          {form.opportunity_type === 'CONSUMABLE' && (
            <div className="space-y-1.5">
              <Label className="text-xs">จำนวน <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} className="h-9 text-xs" placeholder="0" />
            </div>
          )}

          {/* Stage + Probability */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ขั้นตอน</Label>
                <Select value={currentStage} onValueChange={v => set('stage', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION'].map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, ' ')}</SelectItem>
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

          {/* วันปิดคาดการณ์ */}
          <div className="space-y-1.5">
            <Label className="text-xs">วันปิดคาดการณ์</Label>
            <Input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} className="h-9 text-xs" />
          </div>

          {/* ฟิลด์สำหรับ DEVICE */}
          {form.opportunity_type === 'DEVICE' && (
            <div className="p-3 rounded-md border border-muted bg-muted/30 space-y-3">
              <p className="text-xs font-medium text-foreground">ข้อมูลเพิ่มเติม (เครื่องมือ)</p>
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

              <div className="space-y-1.5">
                <Label className="text-xs">คู่แข่งที่เทียบ</Label>
                <Input value={form.competitors} onChange={e => set('competitors', e.target.value)} className="h-9 text-xs" placeholder="เช่น Ultherapy, Thermage..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">เครื่องที่ใช้อยู่ปัจจุบัน</Label>
                <Input value={form.current_devices} onChange={e => set('current_devices', e.target.value)} className="h-9 text-xs" placeholder="เช่น Doublo Gold, HIFU เก่า..." />
              </div>
            </div>
          )}

          {/* ฟิลด์สำหรับ CONSUMABLE */}
          {form.opportunity_type === 'CONSUMABLE' && (
            <div className="p-3 rounded-md border border-muted bg-muted/30 space-y-3">
              <p className="text-xs font-medium text-foreground">ข้อมูลเพิ่มเติม (สิ้นเปลือง)</p>
              <div className="space-y-1.5">
                <Label className="text-xs">ความถี่สั่งซื้อ</Label>
                <Select value={form.order_frequency} onValueChange={v => set('order_frequency', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    {ORDER_FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* กิจกรรมถัดไป */}
          <div className="p-3 rounded-md border border-primary/30 bg-primary/5 space-y-3">
            <p className="text-xs font-medium text-foreground">กิจกรรมถัดไป <span className="text-destructive">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ประเภท</Label>
                <Select value={form.next_activity_type} onValueChange={v => set('next_activity_type', v)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(a => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">วันที่</Label>
                <Input type="date" value={form.next_activity_date} onChange={e => set('next_activity_date', e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
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

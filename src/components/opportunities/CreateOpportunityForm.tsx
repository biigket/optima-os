import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { ExternalLink, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Account, OpportunityType, OpportunityStage } from '@/types';

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
  onSave: (data: any) => void;
}

export default function CreateOpportunityForm({ open, onOpenChange, customer, onSave }: CreateOpportunityFormProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [form, setForm] = useState({
    opportunity_type: '' as OpportunityType | '',
    product_id: '',
    deal_value: '',
    quantity: '',
    stage: '' as OpportunityStage | '',
    close_date: '',
    lead_source: '',
    notes: '',
    next_activity_type: '',
    next_activity_date: '',
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

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const filteredProducts = products.filter(p =>
    !form.opportunity_type || p.category === form.opportunity_type
  );

  const autoStage = form.opportunity_type === 'CONSUMABLE' ? 'CONTACTED' : 'NEW_LEAD';
  const currentStage = form.stage || autoStage;
  const probability = STAGE_PROBABILITY[currentStage] ?? 0;

  const canSave = form.opportunity_type && form.product_id && form.next_activity_type && form.next_activity_date &&
    (form.opportunity_type === 'DEVICE' ? !!form.deal_value : !!form.quantity);

  const handleSave = async () => {
    const selectedProduct = products.find(p => p.id === form.product_id);
    const expectedValue = form.opportunity_type === 'DEVICE'
      ? Number(form.deal_value)
      : Number(form.quantity) * (selectedProduct?.base_price || 0);

    const { data, error } = await supabase.from('opportunities').insert({
      account_id: customer.id,
      stage: currentStage,
      opportunity_type: form.opportunity_type || null,
      interested_products: selectedProduct ? [selectedProduct.product_name] : [],
      expected_value: expectedValue,
      assigned_sale: customer.assigned_sale,
      close_date: form.close_date || null,
      next_activity_type: form.next_activity_type || null,
      next_activity_date: form.next_activity_date || null,
      notes: form.notes || null,
    } as any).select().single();

    if (error) {
      toast.error('เกิดข้อผิดพลาด: ' + error.message);
      return;
    }

    // Pass back with local fields for UI
    onSave({
      ...data,
      opportunity_type: form.opportunity_type,
      next_activity_type: form.next_activity_type,
      next_activity_date: form.next_activity_date,
      quantity: form.quantity ? Number(form.quantity) : undefined,
    });
    toast.success('สร้างโอกาสขายสำเร็จ');
    onOpenChange(false);
    setForm({ opportunity_type: '', product_id: '', deal_value: '', quantity: '', stage: '', close_date: '', lead_source: '', notes: '', next_activity_type: '', next_activity_date: '' });
  };

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
          <div className="space-y-1.5">
            <Label className="text-xs">ประเภท <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(['DEVICE', 'CONSUMABLE'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { set('opportunity_type', t); set('product_id', ''); set('stage', ''); }}
                  className={`flex-1 py-2 rounded-md text-xs font-medium border transition-colors ${form.opportunity_type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted/50'}`}
                >
                  {t === 'DEVICE' ? '🔧 เครื่องมือ' : '📦 สิ้นเปลือง'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">สินค้า <span className="text-destructive">*</span></Label>
            <Select value={form.product_id} onValueChange={v => set('product_id', v)}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
              <SelectContent>
                {filteredProducts.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.product_name}{p.base_price ? ` — ฿${p.base_price.toLocaleString()}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <Label className="text-xs">Probability</Label>
              <Input value={`${probability}%`} readOnly className="h-9 text-xs bg-muted/30" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">วันปิดคาดการณ์</Label>
            <Input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} className="h-9 text-xs" />
          </div>

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

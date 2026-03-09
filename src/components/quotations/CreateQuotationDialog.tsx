import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PaymentConditionSelector from './PaymentConditionSelector';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export default function CreateQuotationDialog({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    qt_number: '',
    account_id: '',
    product: '',
    price: '',
    qt_date: format(new Date(), 'yyyy-MM-dd'),
    payment_condition: 'CASH' as string,
    deposit_type: 'NONE' as string,
    deposit_value: '',
    sale_assigned: '',
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-select'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, clinic_name').order('clinic_name');
      return data || [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-select'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, product_name, base_price').order('product_name');
      return data || [];
    },
  });

  const reset = () => setForm({
    qt_number: '', account_id: '', product: '', price: '',
    qt_date: format(new Date(), 'yyyy-MM-dd'), payment_condition: 'CASH',
    deposit_type: 'NONE', deposit_value: '', sale_assigned: '',
  });

  const handleSave = async () => {
    if (!form.account_id || !form.product) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', description: 'ต้องเลือกลูกค้าและสินค้า', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('quotations').insert({
      qt_number: form.qt_number || null,
      account_id: form.account_id,
      product: form.product,
      price: form.price ? Number(form.price) : null,
      qt_date: form.qt_date || null,
      payment_condition: form.payment_condition || null,
      deposit_type: form.deposit_type || 'NONE',
      deposit_value: form.deposit_value ? Number(form.deposit_value) : 0,
      sale_assigned: form.sale_assigned || null,
      approval_status: 'DRAFT',
      payment_status: 'UNPAID',
    });
    setSaving(false);
    if (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'สร้างใบเสนอราคาสำเร็จ' });
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>สร้างใบเสนอราคาใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>เลขที่ใบเสนอราคา</Label>
              <Input placeholder="QT-2026-XXX" value={form.qt_number} onChange={e => setForm(f => ({ ...f, qt_number: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>วันที่ออก</Label>
              <Input type="date" value={form.qt_date} onChange={e => setForm(f => ({ ...f, qt_date: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ลูกค้า *</Label>
            <Select value={form.account_id} onValueChange={v => setForm(f => ({ ...f, account_id: v }))}>
              <SelectTrigger><SelectValue placeholder="เลือกลูกค้า" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.clinic_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>สินค้า *</Label>
            <Select value={form.product} onValueChange={v => {
              const p = products.find(p => p.product_name === v);
              setForm(f => ({ ...f, product: v, price: p?.base_price ? String(p.base_price) : f.price }));
            }}>
              <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.product_name}>{p.product_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ราคา (฿)</Label>
              <Input type="number" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เงื่อนไขการชำระ</Label>
              <Select value={form.payment_condition} onValueChange={v => setForm(f => ({ ...f, payment_condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">เงินสด</SelectItem>
                  <SelectItem value="INSTALLMENT">ผ่อนชำระ</SelectItem>
                  <SelectItem value="LEASING">ลีสซิ่ง</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>เซลล์ผู้รับผิดชอบ</Label>
            <Input placeholder="ชื่อเซลล์" value={form.sale_assigned} onChange={e => setForm(f => ({ ...f, sale_assigned: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'สร้าง'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

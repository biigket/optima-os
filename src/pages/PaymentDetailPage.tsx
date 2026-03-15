import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Eye, Upload, Clock, CreditCard, CheckCircle2, AlertCircle, XCircle, Calendar, Link2, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { getPaymentConditionLabel } from '@/components/quotations/PaymentConditionSelector';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import { th } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import UploadSlipDialog from '@/components/payments/UploadSlipDialog';
import VerifySlipDialog from '@/components/payments/VerifySlipDialog';
import UploadDepositSlipDialog from '@/components/payments/UploadDepositSlipDialog';

function calcDepositAmount(depositType?: string, depositValue?: number, price?: number): number {
  if (!depositType || depositType === 'NONE' || !depositValue) return 0;
  if (depositType === 'AMOUNT') return depositValue;
  if (depositType === 'PERCENT' && price) return Math.round(price * depositValue / 100);
  return 0;
}

export default function PaymentDetailPage() {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadTarget, setUploadTarget] = useState<any>(null);
  const [verifyTarget, setVerifyTarget] = useState<any>(null);
  const [depositTarget, setDepositTarget] = useState<any>(null);
  const [creatingLink, setCreatingLink] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['payment-detail', quotationId],
    queryFn: async () => {
      const { data: qt, error: qtErr } = await supabase
        .from('quotations')
        .select('id, qt_number, account_id, price, product, payment_condition, payment_status, deposit_type, deposit_value, deposit_slip, deposit_slip_status, deposit_paid_date, has_installments, installment_count, payment_due_day, qt_attachment, customer_signed_at, approved_at, created_at, billing_note_number, tax_invoice_number, delivery_note_number, docs_generated_at, payment_link_url, payment_link_ref, portone_order_id')
        .eq('id', quotationId!)
        .single();
      if (qtErr) throw qtErr;

      const { data: account } = await supabase
        .from('accounts')
        .select('clinic_name, phone, email, address')
        .eq('id', qt.account_id!)
        .single();

      const { data: installments } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('quotation_id', quotationId!)
        .order('installment_number', { ascending: true });

      const { data: paymentLinks } = await supabase
        .from('payment_links' as any)
        .select('*')
        .eq('quotation_id', quotationId!)
        .order('created_at', { ascending: false });

      return { qt, account, installments: installments || [], paymentLinks: (paymentLinks || []) as any[] };
    },
    enabled: !!quotationId,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['payment-detail', quotationId] });

  const summary = useMemo(() => {
    if (!data) return { total: 0, paid: 0, remaining: 0, depositAmount: 0, paidCount: 0, totalCount: 0 };
    const total = data.qt.price || 0;
    const depositAmount = calcDepositAmount(data.qt.deposit_type || undefined, data.qt.deposit_value || undefined, total);
    const depositPaid = data.qt.payment_status === 'DEPOSIT_PAID' || data.qt.payment_status === 'PAID';
    let paidFromInstallments = 0;
    let paidCount = 0;
    data.installments.forEach(i => {
      if (i.slip_status === 'VERIFIED' || i.paid_date) {
        paidFromInstallments += (i.amount || 0);
        paidCount++;
      }
    });
    const paid = paidFromInstallments + (depositPaid ? depositAmount : 0);
    return { total, paid, remaining: total - paid, depositAmount, paidCount, totalCount: data.installments.length };
  }, [data]);

  // Build timeline events
  const timeline = useMemo(() => {
    if (!data) return [];
    const events: { date: string; icon: string; label: string; detail?: string }[] = [];

    if (data.qt.created_at) events.push({ date: data.qt.created_at, icon: 'create', label: 'สร้างใบเสนอราคา', detail: data.qt.qt_number || '' });
    if (data.qt.approved_at) events.push({ date: data.qt.approved_at, icon: 'approve', label: 'อนุมัติใบเสนอราคา' });
    if (data.qt.customer_signed_at) events.push({ date: data.qt.customer_signed_at, icon: 'sign', label: 'ลูกค้าเซ็นใบเสนอราคา' });
    if (data.qt.deposit_paid_date) events.push({ date: data.qt.deposit_paid_date, icon: 'deposit', label: 'ชำระมัดจำ', detail: `฿${summary.depositAmount.toLocaleString()}` });
    if (data.qt.docs_generated_at) events.push({ date: data.qt.docs_generated_at, icon: 'create', label: 'ออกใบวางบิล / ใบกำกับภาษี / ใบส่งของ', detail: `${data.qt.billing_note_number || ''}` });

    data.installments.forEach(i => {
      if (i.slip_uploaded_at) events.push({ date: i.slip_uploaded_at, icon: 'upload', label: `อัพสลิปงวดที่ ${i.installment_number}`, detail: i.payment_channel || undefined });
      if (i.verified_at) events.push({ date: i.verified_at, icon: 'verify', label: `อนุมัติสลิปงวดที่ ${i.installment_number}`, detail: `฿${(i.amount || 0).toLocaleString()}` });
      if (i.reject_reason) events.push({ date: i.verified_at || i.created_at, icon: 'reject', label: `ปฏิเสธสลิปงวดที่ ${i.installment_number}`, detail: i.reject_reason || undefined });
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, summary]);

  const getTimelineIcon = (icon: string) => {
    switch (icon) {
      case 'create': return <FileText size={14} className="text-muted-foreground" />;
      case 'approve': return <CheckCircle2 size={14} className="text-success" />;
      case 'sign': return <FileText size={14} className="text-primary" />;
      case 'deposit': return <CreditCard size={14} className="text-accent" />;
      case 'upload': return <Upload size={14} className="text-warning" />;
      case 'verify': return <CheckCircle2 size={14} className="text-success" />;
      case 'reject': return <XCircle size={14} className="text-destructive" />;
      default: return <Clock size={14} className="text-muted-foreground" />;
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        กำลังโหลด...
      </div>
    );
  }

  const { qt, account, installments, paymentLinks } = data;
  const depositAmount = summary.depositAmount;
  const hasDeposit = qt.deposit_type && qt.deposit_type !== 'NONE' && (qt.deposit_value || 0) > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{qt.qt_number}</h1>
            <StatusBadge status={qt.payment_status || 'UNPAID'} />
          </div>
          <p className="text-sm text-muted-foreground">{account?.clinic_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {qt.qt_attachment && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
              const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quotation-pdf`;
              try {
                const res = await fetch(fnUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                  body: JSON.stringify({ quotation_id: qt.id }),
                });
                const html = await res.text();
                const win = window.open('', '_blank');
                if (win) { win.document.write(html); win.document.close(); }
              } catch (e) { console.error(e); }
            }}>
              <FileText size={14} /> ใบเสนอราคา
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-payment-docs`;
            try {
              const res = await fetch(fnUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                body: JSON.stringify({ quotation_id: qt.id, doc_type: 'BN' }),
              });
              const html = await res.text();
              const win = window.open('', '_blank');
              if (win) { win.document.write(html); win.document.close(); }
            } catch (e) { console.error(e); }
          }}>
            <FileText size={14} /> ใบวางบิล
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-payment-docs`;
            try {
              const res = await fetch(fnUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                body: JSON.stringify({ quotation_id: qt.id, doc_type: 'IV' }),
              });
              const html = await res.text();
              const win = window.open('', '_blank');
              if (win) { win.document.write(html); win.document.close(); }
            } catch (e) { console.error(e); }
          }}>
            <FileText size={14} /> ใบกำกับภาษี
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-payment-docs`;
            try {
              const res = await fetch(fnUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                body: JSON.stringify({ quotation_id: qt.id, doc_type: 'DN' }),
              });
              const html = await res.text();
              const win = window.open('', '_blank');
              if (win) { win.document.write(html); win.document.close(); }
            } catch (e) { console.error(e); }
          }}>
            <FileText size={14} /> ใบส่งของ
          </Button>
        </div>
      </div>

      {/* Mini KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ยอดรวม</p>
            <p className="text-lg font-bold text-foreground">฿{summary.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">ชำระแล้ว</p>
            <p className="text-lg font-bold text-success">฿{summary.paid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">คงค้าง</p>
            <p className="text-lg font-bold text-destructive">฿{summary.remaining.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">จ่ายแล้ว / ทั้งหมด</p>
            <p className="text-lg font-bold text-foreground">{summary.paidCount} / {summary.totalCount} งวด</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Installments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ข้อมูลใบเสนอราคา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">ลูกค้า</span>
                  <p className="font-medium">{account?.clinic_name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">สินค้า</span>
                  <p className="font-medium">{qt.product || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">เงื่อนไขการชำระ</span>
                  <p className="font-medium">{getPaymentConditionLabel(qt.payment_condition)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ราคา</span>
                  <p className="font-medium">฿{(qt.price || 0).toLocaleString()}</p>
                </div>
                {hasDeposit && (
                  <div>
                    <span className="text-muted-foreground">มัดจำ</span>
                    <p className="font-medium">
                      {qt.deposit_type === 'PERCENT' ? `${qt.deposit_value}%` : ''} ฿{depositAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                {qt.has_installments && (
                  <>
                    <div>
                      <span className="text-muted-foreground">จำนวนงวด</span>
                      <p className="font-medium">{qt.installment_count} งวด</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">วันครบกำหนดจ่าย</span>
                      <p className="font-medium">ทุกวันที่ {qt.payment_due_day} ของเดือน</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">โทรศัพท์</span>
                  <p className="font-medium">{account?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">อีเมล</span>
                  <p className="font-medium">{account?.email || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deposit Status Panel */}
          {hasDeposit && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <CreditCard size={14} /> สถานะมัดจำ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">ยอดมัดจำ</p>
                    <p className="text-lg font-bold text-foreground">
                      {qt.deposit_type === 'PERCENT' ? `${qt.deposit_value}% ` : ''}฿{depositAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={qt.payment_status === 'DEPOSIT_PAID' || qt.payment_status === 'PAID' ? 'DEPOSIT_PAID' : (qt.deposit_slip_status || 'NO_SLIP')} />
                    {qt.payment_status !== 'DEPOSIT_PAID' && qt.payment_status !== 'PAID' && (!qt.deposit_slip_status || qt.deposit_slip_status === 'NO_SLIP') && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setDepositTarget({
                        id: qt.id,
                        deposit_amount: depositAmount,
                        qt_number: qt.qt_number || '',
                      })}>
                        <Upload size={12} /> อัพสลิปมัดจำ
                      </Button>
                    )}
                    {qt.deposit_slip && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => window.open(qt.deposit_slip!, '_blank')}>
                        <Eye size={12} /> ดูสลิป
                      </Button>
                    )}
                  </div>
                </div>
                {qt.deposit_paid_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ชำระเมื่อ {format(new Date(qt.deposit_paid_date), 'd MMM yyyy', { locale: th })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* PortOne Payment Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Link2 size={14} /> ลิงก์ชำระเงินออนไลน์ (บัตรเครดิต)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(qt as any).payment_link_url ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
                    <Link2 size={14} className="text-primary shrink-0" />
                    <p className="text-xs font-mono text-foreground truncate flex-1">{(qt as any).payment_link_url}</p>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs shrink-0" onClick={() => {
                      navigator.clipboard.writeText((qt as any).payment_link_url);
                      toast.success('คัดลอกลิงก์แล้ว');
                    }}>
                      <Copy size={12} /> คัดลอก
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs shrink-0" onClick={() => window.open((qt as any).payment_link_url, '_blank')}>
                      <ExternalLink size={12} /> เปิด
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ref: {(qt as any).payment_link_ref || '-'} • สามารถส่งลิงก์นี้ให้ลูกค้าเพื่อชำระผ่านบัตรเครดิตได้โดยตรง
                  </p>
                   {/* Regenerate link with custom amount */}
                  <div className="space-y-2 mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs font-medium text-foreground">สร้างลิงก์ใหม่</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">ยอดเงิน</span>
                      <input
                        type="number"
                        min="1"
                        placeholder={String(qt.price || 0)}
                        value={customAmount}
                        onChange={e => setCustomAmount(e.target.value)}
                        className="flex h-8 w-32 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-xs text-muted-foreground">฿</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { value: 0, label: 'เต็มจำนวน' },
                        { value: 3, label: '3 เดือน' },
                        { value: 6, label: '6 เดือน' },
                        { value: 10, label: '10 เดือน' },
                      ].map(opt => (
                        <Button key={opt.value} size="sm" variant={installmentMonths === opt.value ? 'default' : 'outline'} className="text-[10px] h-6 px-2" onClick={() => setInstallmentMonths(opt.value)}>
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    {installmentMonths > 0 && (
                      <p className="text-[10px] text-primary font-medium">
                        ≈ ฿{Math.ceil((Number(customAmount) || qt.price || 0) / installmentMonths).toLocaleString()} / เดือน
                      </p>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" disabled={creatingLink} onClick={async () => {
                      const amt = Number(customAmount) || undefined;
                      setCreatingLink(true);
                      try {
                        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portone-create-link`;
                        const res = await fetch(fnUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                          body: JSON.stringify({ quotation_id: qt.id, installment_months: installmentMonths || undefined, custom_amount: amt }),
                        });
                        const result = await res.json();
                        if (result.success) {
                          toast.success('สร้างลิงก์ใหม่สำเร็จ');
                          setCustomAmount('');
                          refetch();
                        } else {
                          toast.error(result.error || 'สร้างลิงก์ไม่สำเร็จ');
                        }
                      } catch (e) { toast.error('เกิดข้อผิดพลาด'); }
                      setCreatingLink(false);
                    }}>
                      {creatingLink ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                      สร้างลิงก์ใหม่
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground text-center">ยังไม่ได้สร้างลิงก์ชำระเงินออนไลน์</p>
                  <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">ยอดเงินที่ต้องการเรียกเก็บ</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder={String(qt.price || 0)}
                          value={customAmount}
                          onChange={e => setCustomAmount(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">฿</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">หากไม่กรอก จะใช้ยอดจากใบเสนอราคา (฿{(qt.price || 0).toLocaleString()})</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">เลือกรูปแบบชำระ</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 0, label: 'เต็มจำนวน' },
                          { value: 3, label: 'ผ่อน 3 เดือน' },
                          { value: 6, label: 'ผ่อน 6 เดือน' },
                          { value: 10, label: 'ผ่อน 10 เดือน' },
                        ].map(opt => (
                          <Button key={opt.value} size="sm" variant={installmentMonths === opt.value ? 'default' : 'outline'} className="text-xs" onClick={() => setInstallmentMonths(opt.value)}>
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      {installmentMonths > 0 && (
                        <p className="text-xs text-primary font-medium mt-1">
                          ยอดต่อเดือน ≈ ฿{Math.ceil((Number(customAmount) || qt.price || 0) / installmentMonths).toLocaleString()} / เดือน
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <Button className="gap-1.5" disabled={creatingLink} onClick={async () => {
                      const amt = Number(customAmount) || undefined;
                      setCreatingLink(true);
                      try {
                        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portone-create-link`;
                        const res = await fetch(fnUrl, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                          body: JSON.stringify({ quotation_id: qt.id, installment_months: installmentMonths || undefined, custom_amount: amt }),
                        });
                        const result = await res.json();
                        if (result.success) {
                          toast.success('สร้างลิงก์ชำระเงินสำเร็จ');
                          setCustomAmount('');
                          refetch();
                        } else {
                          toast.error(result.error || 'สร้างลิงก์ไม่สำเร็จ');
                        }
                      } catch (e) { toast.error('เกิดข้อผิดพลาด'); }
                      setCreatingLink(false);
                    }}>
                      {creatingLink ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                      สร้างลิงก์ชำระเงิน (บัตรเครดิต)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">ลูกค้าสามารถชำระผ่านบัตรเครดิตพร้อมผ่อนชำระได้ • รองรับการรูดหลายใบ</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Links History */}
          {paymentLinks && paymentLinks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <CreditCard size={14} /> ประวัติลิงก์ชำระเงิน ({paymentLinks.length} รายการ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>วันที่สร้าง</TableHead>
                      <TableHead className="text-right">ยอดเงิน</TableHead>
                      <TableHead>ผ่อนชำระ</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">ลิงก์</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.map((link: any) => (
                      <TableRow key={link.id}>
                        <TableCell className="text-sm">
                          {format(new Date(link.created_at), 'd MMM yyyy HH:mm', { locale: th })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{Number(link.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {link.installment_months > 0 ? `${link.installment_months} เดือน` : 'เต็มจำนวน'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={link.status || 'ACTIVE'} />
                        </TableCell>
                        <TableCell className="text-right">
                          {link.payment_link_url && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => {
                                navigator.clipboard.writeText(link.payment_link_url);
                                toast.success('คัดลอกลิงก์แล้ว');
                              }}>
                                <Copy size={12} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => window.open(link.payment_link_url, '_blank')}>
                                <ExternalLink size={12} />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Installments Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">ตารางงวดชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-16">งวดที่</TableHead>
                    <TableHead className="text-right">ยอด</TableHead>
                    <TableHead>วันครบกำหนด</TableHead>
                    <TableHead>ช่องทาง</TableHead>
                    <TableHead>สถานะสลิป</TableHead>
                    <TableHead>กำหนดชำระ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่มีรายการงวด</TableCell>
                    </TableRow>
                  ) : (
                    installments.map(row => {
                      const isOverdue = row.due_date && row.slip_status !== 'VERIFIED' && !row.paid_date &&
                        differenceInDays(new Date(), new Date(row.due_date)) > 0;
                      const daysInfo = row.due_date && row.slip_status !== 'VERIFIED' && !row.paid_date
                        ? differenceInDays(new Date(), new Date(row.due_date))
                        : null;

                      return (
                        <TableRow key={row.id} className={isOverdue ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-center font-medium">{row.installment_number}</TableCell>
                          <TableCell className="text-right font-medium">฿{(row.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.due_date ? format(new Date(row.due_date), 'd MMM yyyy', { locale: th }) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{row.payment_channel || '-'}</TableCell>
                          <TableCell><StatusBadge status={row.slip_status || 'NO_SLIP'} /></TableCell>
                          <TableCell>
                            {daysInfo !== null && (
                              <span className={`text-xs font-medium ${daysInfo > 0 ? 'text-destructive' : daysInfo >= -3 ? 'text-warning' : 'text-muted-foreground'}`}>
                                {daysInfo > 0 ? `เกิน ${daysInfo} วัน` : daysInfo >= -3 ? `อีก ${Math.abs(daysInfo)} วัน` : ''}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(row.slip_status === 'NO_SLIP' || row.slip_status === 'REJECTED') && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setUploadTarget(row)}>
                                  <Upload size={12} /> อัพสลิป
                                </Button>
                              )}
                              {row.slip_status === 'PENDING_VERIFY' && (
                                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setVerifyTarget(row)}>
                                  <Eye size={12} /> ตรวจสอบ
                                </Button>
                              )}
                              {row.slip_status === 'VERIFIED' && row.slip_file && (
                                <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => window.open(row.slip_file!, '_blank')}>
                                  <Eye size={12} /> ดูสลิป
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right: Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Clock size={14} /> ไทม์ไลน์การชำระ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีรายการ</p>
              ) : (
                <div className="space-y-0">
                  {timeline.map((ev, i) => (
                    <div key={i} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {getTimelineIcon(ev.icon)}
                        </div>
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-medium text-foreground">{ev.label}</p>
                        {ev.detail && <p className="text-xs text-muted-foreground">{ev.detail}</p>}
                        <p className="text-[11px] text-muted-foreground/70">
                          {format(new Date(ev.date), 'd MMM yyyy HH:mm', { locale: th })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Slip Gallery */}
          {(installments.some(i => i.slip_file) || qt.deposit_slip) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">หลักฐานการชำระ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {qt.deposit_slip && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">สลิปมัดจำ</p>
                    <img
                      src={qt.deposit_slip}
                      alt="สลิปมัดจำ"
                      className="w-full rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(qt.deposit_slip!, '_blank')}
                    />
                  </div>
                )}
                {installments.filter(i => i.slip_file).map(i => (
                  <div key={i.id} className="space-y-1">
                    <p className="text-xs text-muted-foreground">สลิปงวดที่ {i.installment_number}</p>
                    <img
                      src={i.slip_file!}
                      alt={`สลิปงวดที่ ${i.installment_number}`}
                      className="w-full rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(i.slip_file!, '_blank')}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UploadSlipDialog open={!!uploadTarget} onOpenChange={v => { if (!v) setUploadTarget(null); }} installment={uploadTarget} onSuccess={refetch} />
      <VerifySlipDialog open={!!verifyTarget} onOpenChange={v => { if (!v) setVerifyTarget(null); }} installment={verifyTarget} onSuccess={refetch} />
      <UploadDepositSlipDialog open={!!depositTarget} onOpenChange={v => { if (!v) setDepositTarget(null); }} quotation={depositTarget} onSuccess={refetch} />
    </div>
  );
}

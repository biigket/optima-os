import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Upload, Eye, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import PaymentKpiCards from '@/components/payments/PaymentKpiCards';
import UploadSlipDialog from '@/components/payments/UploadSlipDialog';
import VerifySlipDialog from '@/components/payments/VerifySlipDialog';
import { differenceInDays } from 'date-fns';

type SlipStatus = 'NO_SLIP' | 'PENDING_VERIFY' | 'VERIFIED' | 'REJECTED';

interface InstallmentRow {
  id: string;
  quotation_id: string;
  installment_number: number;
  due_date: string | null;
  amount: number | null;
  paid_date: string | null;
  slip_file: string | null;
  payment_channel: string | null;
  slip_status: string | null;
  payment_date: string | null;
  clinic_name?: string;
  qt_number?: string;
}

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [uploadTarget, setUploadTarget] = useState<InstallmentRow | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<InstallmentRow | null>(null);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['payment-installments'],
    queryFn: async () => {
      // 1) Fetch all CUSTOMER_SIGNED quotations
      const { data: signedQts, error: qtErr } = await supabase
        .from('quotations')
        .select('id, qt_number, account_id, price, payment_condition, payment_status')
        .eq('approval_status', 'CUSTOMER_SIGNED')
        .order('created_at', { ascending: false });
      if (qtErr) throw qtErr;
      if (!signedQts || signedQts.length === 0) return [];

      const qtIds = signedQts.map(q => q.id);

      // 2) Fetch existing installments for those quotations
      const { data: installments, error: instErr } = await supabase
        .from('payment_installments')
        .select('*')
        .in('quotation_id', qtIds)
        .order('due_date', { ascending: true });
      if (instErr) throw instErr;

      // 3) Auto-create installments for signed QTs that don't have any
      const existingQtIds = new Set((installments || []).map(i => i.quotation_id));
      const missingQts = signedQts.filter(q => !existingQtIds.has(q.id));

      let newInstallments: any[] = [];
      if (missingQts.length > 0) {
        const toInsert: any[] = [];
        for (const qt of missingQts) {
          const totalPrice = qt.price || 0;
          const condition = qt.payment_condition || 'CASH';
          const today = new Date();

          if (condition === 'INSTALLMENT') {
            const splits = [0.5, 0.25, 0.25];
            splits.forEach((pct, i) => {
              const dueDate = new Date(today);
              dueDate.setDate(dueDate.getDate() + i * 30);
              toInsert.push({
                quotation_id: qt.id,
                installment_number: i + 1,
                amount: Math.round(totalPrice * pct),
                due_date: dueDate.toISOString().split('T')[0],
              });
            });
          } else {
            toInsert.push({
              quotation_id: qt.id,
              installment_number: 1,
              amount: totalPrice,
              due_date: today.toISOString().split('T')[0],
            });
          }
        }
        if (toInsert.length > 0) {
          const { data: created } = await supabase
            .from('payment_installments')
            .insert(toInsert)
            .select();
          newInstallments = created || [];
        }
      }

      const allInstallments = [...(installments || []), ...newInstallments];

      // 4) Fetch related accounts
      const accountIds = [...new Set(signedQts.map(q => q.account_id).filter(Boolean))] as string[];
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, clinic_name')
        .in('id', accountIds.length > 0 ? accountIds : ['__none__']);

      const qtMap = Object.fromEntries(signedQts.map(q => [q.id, q]));
      const accMap = Object.fromEntries((accounts || []).map(a => [a.id, a]));

      return allInstallments.map((r: any) => {
        const qt = qtMap[r.quotation_id];
        const acc = qt?.account_id ? accMap[qt.account_id] : null;
        return {
          ...r,
          clinic_name: acc?.clinic_name || '',
          qt_number: qt?.qt_number || '',
          slip_status: r.slip_status || 'NO_SLIP',
        } as InstallmentRow;
      });
    },
  });

  const kpi = useMemo(() => {
    const today = new Date();
    let totalDue = 0, totalPaid = 0, pendingVerify = 0, overdue = 0;
    rows.forEach(r => {
      const amt = r.amount || 0;
      if (r.slip_status === 'VERIFIED' || r.paid_date) {
        totalPaid += amt;
      } else {
        totalDue += amt;
        if (r.slip_status === 'PENDING_VERIFY') pendingVerify++;
        if (r.due_date && differenceInDays(today, new Date(r.due_date)) > 0 && r.slip_status !== 'VERIFIED') {
          overdue++;
        }
      }
    });
    return { totalDue, totalPaid, pendingVerify, overdue };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const matchSearch = !search ||
        (r.clinic_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.qt_number || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.slip_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const getOverdueLabel = (row: InstallmentRow) => {
    if (!row.due_date || row.slip_status === 'VERIFIED' || row.paid_date) return null;
    const days = differenceInDays(new Date(), new Date(row.due_date));
    if (days > 0) return `เกิน ${days} วัน`;
    if (days >= -3) return `อีก ${Math.abs(days)} วัน`;
    return null;
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['payment-installments'] });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">การชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">จัดการงวดชำระเงินและตรวจสอบสลิป</p>
      </div>

      <PaymentKpiCards data={kpi} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาลูกค้าหรือเลขที่ QT..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter size={14} className="mr-1" />
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            <SelectItem value="NO_SLIP">ยังไม่อัพสลิป</SelectItem>
            <SelectItem value="PENDING_VERIFY">รอตรวจสอบ</SelectItem>
            <SelectItem value="VERIFIED">อนุมัติแล้ว</SelectItem>
            <SelectItem value="REJECTED">ถูกปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QT#</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead className="text-center">งวดที่</TableHead>
              <TableHead className="text-right">ยอด</TableHead>
              <TableHead>วันครบกำหนด</TableHead>
              <TableHead>ช่องทาง</TableHead>
              <TableHead>สถานะสลิป</TableHead>
              <TableHead>กำหนดชำระ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">ไม่พบรายการ</TableCell></TableRow>
            ) : (
              filtered.map(row => {
                const overdueLabel = getOverdueLabel(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-xs">{row.qt_number}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.clinic_name}</TableCell>
                    <TableCell className="text-center">{row.installment_number}</TableCell>
                    <TableCell className="text-right font-medium">฿{(row.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.due_date || '-'}</TableCell>
                    <TableCell className="text-sm">{row.payment_channel || '-'}</TableCell>
                    <TableCell><StatusBadge status={row.slip_status || 'NO_SLIP'} /></TableCell>
                    <TableCell>
                      {overdueLabel && (
                        <span className={`text-xs font-medium ${overdueLabel.startsWith('เกิน') ? 'text-destructive' : 'text-warning'}`}>
                          {overdueLabel}
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
      </div>

      <UploadSlipDialog
        open={!!uploadTarget}
        onOpenChange={v => { if (!v) setUploadTarget(null); }}
        installment={uploadTarget}
        onSuccess={refetch}
      />
      <VerifySlipDialog
        open={!!verifyTarget}
        onOpenChange={v => { if (!v) setVerifyTarget(null); }}
        installment={verifyTarget}
        onSuccess={refetch}
      />
    </div>
  );
}

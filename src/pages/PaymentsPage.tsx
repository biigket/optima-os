import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Eye, Filter, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import PaymentKpiCards from '@/components/payments/PaymentKpiCards';
import UploadSlipDialog from '@/components/payments/UploadSlipDialog';
import VerifySlipDialog from '@/components/payments/VerifySlipDialog';
import UploadDepositSlipDialog from '@/components/payments/UploadDepositSlipDialog';
import { getPaymentConditionLabel } from '@/components/quotations/PaymentConditionSelector';
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
  payment_condition?: string;
  deposit_type?: string;
  deposit_value?: number;
  deposit_slip?: string;
  deposit_slip_status?: string;
  payment_status?: string;
  price?: number;
  qt_attachment?: string;
}

const CONDITION_TABS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CREDIT_CARD', label: 'บัตรเครดิต' },
  { value: 'CREDIT', label: 'เครดิต' },
  { value: 'LEASING', label: 'ลีสซิ่ง' },
  { value: 'POST_CHECK', label: 'โพสต์เช็ค' },
];

function getConditionGroup(condition?: string | null): string {
  if (!condition) return 'CASH';
  if (condition.startsWith('CREDIT_CARD')) return 'CREDIT_CARD';
  if (condition.startsWith('CREDIT_')) return 'CREDIT';
  if (condition.startsWith('LEASING')) return 'LEASING';
  if (condition.startsWith('POST_CHECK')) return 'POST_CHECK';
  return 'CASH';
}

function calcDepositAmount(depositType?: string, depositValue?: number, price?: number): number {
  if (!depositType || depositType === 'NONE' || !depositValue) return 0;
  if (depositType === 'AMOUNT') return depositValue;
  if (depositType === 'PERCENT' && price) return Math.round(price * depositValue / 100);
  return 0;
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [conditionTab, setConditionTab] = useState('ALL');
  const [uploadTarget, setUploadTarget] = useState<InstallmentRow | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<InstallmentRow | null>(null);
  const [depositTarget, setDepositTarget] = useState<{ id: string; deposit_amount: number; qt_number: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['payment-installments'],
    queryFn: async () => {
      const { data: signedQts, error: qtErr } = await supabase
        .from('quotations')
        .select('id, qt_number, account_id, price, payment_condition, payment_status, deposit_type, deposit_value, deposit_slip, deposit_slip_status, has_installments, installment_count, payment_due_day, qt_attachment')
        .eq('approval_status', 'CUSTOMER_SIGNED')
        .order('created_at', { ascending: false });
      if (qtErr) throw qtErr;
      if (!signedQts || signedQts.length === 0) return [];

      const qtIds = signedQts.map(q => q.id);

      const { data: installments, error: instErr } = await supabase
        .from('payment_installments')
        .select('*')
        .in('quotation_id', qtIds)
        .order('due_date', { ascending: true });
      if (instErr) throw instErr;

      // Group existing installments by quotation_id
      const installmentsByQt = new Map<string, any[]>();
      (installments || []).forEach(i => {
        const arr = installmentsByQt.get(i.quotation_id) || [];
        arr.push(i);
        installmentsByQt.set(i.quotation_id, arr);
      });

      // Find QTs that need installments created or recreated (count mismatch)
      const qtsToProcess: typeof signedQts = [];
      const idsToDelete: string[] = [];

      for (const qt of signedQts) {
        const existing = installmentsByQt.get(qt.id) || [];
        const expectedCount = (qt.has_installments && qt.installment_count && qt.installment_count > 1) ? qt.installment_count : 1;
        if (existing.length === 0) {
          qtsToProcess.push(qt);
        } else if (existing.length !== expectedCount) {
          // Mismatch — delete old and recreate
          idsToDelete.push(...existing.map((e: any) => e.id));
          qtsToProcess.push(qt);
        }
      }

      // Delete mismatched installments
      if (idsToDelete.length > 0) {
        await supabase.from('payment_installments').delete().in('id', idsToDelete);
      }

      let newInstallments: any[] = [];
      if (qtsToProcess.length > 0) {
        const toInsert: any[] = [];
        for (const qt of qtsToProcess) {
          const totalPrice = qt.price || 0;
          const today = new Date();
          const hasInstallments = qt.has_installments === true;
          const installmentCount = (qt.installment_count && qt.installment_count > 1) ? qt.installment_count : 1;
          const dueDay = qt.payment_due_day || today.getDate();

          // คำนวณยอดมัดจำ
          let depositAmount = 0;
          if (qt.deposit_type === 'AMOUNT' && (qt.deposit_value || 0) > 0) {
            depositAmount = qt.deposit_value!;
          } else if (qt.deposit_type === 'PERCENT' && (qt.deposit_value || 0) > 0) {
            depositAmount = Math.round(totalPrice * qt.deposit_value! / 100);
          }

          if (hasInstallments && installmentCount > 1) {
            // หักมัดจำออกก่อน แล้วแบ่งจ่ายเท่าๆ กัน ตามจำนวนงวด
            const amountAfterDeposit = totalPrice - depositAmount;
            const perInstallment = Math.floor(amountAfterDeposit / installmentCount);
            const remainder = amountAfterDeposit - perInstallment * installmentCount;

            for (let i = 0; i < installmentCount; i++) {
              // คำนวณวันครบกำหนดแต่ละงวด ตาม payment_due_day
              const dueDate = new Date(today.getFullYear(), today.getMonth() + i, dueDay);
              // ถ้าวันกำหนดงวดแรกผ่านไปแล้ว ให้เริ่มเดือนถัดไป
              if (i === 0 && dueDate < today) {
                dueDate.setMonth(dueDate.getMonth() + 1);
                // ปรับงวดถัดๆ ไปด้วย
                for (let j = 1; j < installmentCount; j++) {
                  // จะถูกสร้างใน loop หลัก
                }
              }
              toInsert.push({
                quotation_id: qt.id,
                installment_number: i + 1,
                amount: i === 0 ? perInstallment + remainder : perInstallment,
                due_date: dueDate.toISOString().split('T')[0],
              });
            }

            // ปรับวันที่ถ้างวดแรกผ่านไปแล้ว
            if (toInsert.length > 0) {
              const firstDue = new Date(toInsert[toInsert.length - installmentCount].due_date);
              if (firstDue < today) {
                for (let i = toInsert.length - installmentCount; i < toInsert.length; i++) {
                  const d = new Date(today.getFullYear(), today.getMonth() + 1 + (i - (toInsert.length - installmentCount)), dueDay);
                  toInsert[i].due_date = d.toISOString().split('T')[0];
                }
              }
            }
          } else {
            // งวดเดียว — หักมัดจำออกด้วย
            toInsert.push({
              quotation_id: qt.id,
              installment_number: 1,
              amount: totalPrice - depositAmount,
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

      // Combine: keep existing (minus deleted) + newly created
      const deletedSet = new Set(idsToDelete);
      const keptInstallments = (installments || []).filter((i: any) => !deletedSet.has(i.id));
      const allInstallments = [...keptInstallments, ...newInstallments];

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
          payment_condition: qt?.payment_condition || null,
          deposit_type: (qt as any)?.deposit_type || 'NONE',
          deposit_value: (qt as any)?.deposit_value || 0,
          deposit_slip: (qt as any)?.deposit_slip || null,
          deposit_slip_status: (qt as any)?.deposit_slip_status || 'NO_SLIP',
          payment_status: qt?.payment_status || 'UNPAID',
          price: qt?.price || 0,
          qt_attachment: (qt as any)?.qt_attachment || null,
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
      const matchCondition = conditionTab === 'ALL' || getConditionGroup(r.payment_condition) === conditionTab;
      return matchSearch && matchStatus && matchCondition;
    });
  }, [rows, search, statusFilter, conditionTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length };
    rows.forEach(r => {
      const group = getConditionGroup(r.payment_condition);
      counts[group] = (counts[group] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const getOverdueLabel = (row: InstallmentRow) => {
    if (!row.due_date || row.slip_status === 'VERIFIED' || row.paid_date) return null;
    const days = differenceInDays(new Date(), new Date(row.due_date));
    if (days > 0) return `เกิน ${days} วัน`;
    if (days >= -3) return `อีก ${Math.abs(days)} วัน`;
    return null;
  };

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['payment-installments'] });

  // Deduplicate deposit info per quotation
  const depositByQt = useMemo(() => {
    const map = new Map<string, InstallmentRow>();
    rows.forEach(r => {
      if (!map.has(r.quotation_id) && r.deposit_type && r.deposit_type !== 'NONE' && (r.deposit_value || 0) > 0) {
        map.set(r.quotation_id, r);
      }
    });
    return map;
  }, [rows]);

  const hasDeposit = (row: InstallmentRow) => {
    return row.deposit_type && row.deposit_type !== 'NONE' && (row.deposit_value || 0) > 0;
  };

  // Get unique QTs with deposits for filtered rows
  const filteredDepositQts = useMemo(() => {
    const seen = new Set<string>();
    return filtered.filter(r => {
      if (seen.has(r.quotation_id) || !hasDeposit(r)) return false;
      seen.add(r.quotation_id);
      return true;
    });
  }, [filtered]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">การชำระเงิน</h1>
        <p className="text-sm text-muted-foreground">จัดการงวดชำระเงินและตรวจสอบสลิป</p>
      </div>

      <PaymentKpiCards data={kpi} />

      {/* Deposit Slip Section */}
      {filteredDepositQts.length > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">สลิปมัดจำ</h2>
          <div className="space-y-2">
            {filteredDepositQts.map(row => {
              const depositAmt = calcDepositAmount(row.deposit_type, row.deposit_value, row.price);
              return (
                <div key={`dep-${row.quotation_id}`} className="flex items-center justify-between p-3 rounded-md bg-muted/50 gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">{row.qt_number}</span>
                    <span className="text-sm truncate">{row.clinic_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      มัดจำ {row.deposit_type === 'PERCENT' ? `${row.deposit_value}%` : ''} ฿{depositAmt.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={row.payment_status === 'DEPOSIT_PAID' ? 'DEPOSIT_PAID' : (row.deposit_slip_status || 'NO_SLIP')} />
                    {row.payment_status !== 'DEPOSIT_PAID' && (!row.deposit_slip_status || row.deposit_slip_status === 'NO_SLIP') && (
                      <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setDepositTarget({
                        id: row.quotation_id,
                        deposit_amount: depositAmt,
                        qt_number: row.qt_number || '',
                      })}>
                        <Upload size={12} /> อัพสลิปมัดจำ
                      </Button>
                    )}
                    {row.deposit_slip && row.payment_status === 'DEPOSIT_PAID' && (
                      <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => window.open(row.deposit_slip!, '_blank')}>
                        <Eye size={12} /> ดูสลิป
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Condition Tabs */}
      <Tabs value={conditionTab} onValueChange={setConditionTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {CONDITION_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
              {(tabCounts[tab.value] || 0) > 0 && (
                <span className="ml-1.5 text-[10px] bg-muted-foreground/20 rounded-full px-1.5 py-0.5">
                  {tabCounts[tab.value] || 0}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
              <TableHead>เงื่อนไข</TableHead>
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
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">ไม่พบรายการ</TableCell></TableRow>
            ) : (
              filtered.map(row => {
                const overdueLabel = getOverdueLabel(row);
                return (
                  <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payments/${row.quotation_id}`)}>
                    <TableCell className="font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <span>{row.qt_number}</span>
                        {row.qt_attachment && (
                          <Button size="sm" variant="ghost" className="gap-1 text-xs h-6 px-1.5 text-primary" onClick={async () => {
                            const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quotation-pdf`;
                            try {
                              const res = await fetch(fnUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
                                body: JSON.stringify({ quotation_id: row.quotation_id }),
                              });
                              const html = await res.text();
                              const win = window.open('', '_blank');
                              if (win) { win.document.write(html); win.document.close(); }
                            } catch (e) { console.error(e); }
                          }}>
                            <FileText size={12} /> ดูใบเสนอราคา
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.clinic_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {getPaymentConditionLabel(row.payment_condition)}
                    </TableCell>
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
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
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
      <UploadDepositSlipDialog
        open={!!depositTarget}
        onOpenChange={v => { if (!v) setDepositTarget(null); }}
        quotation={depositTarget}
        onSuccess={refetch}
      />
    </div>
  );
}
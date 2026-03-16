import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface InstallmentRow {
  id: string;
  quotation_id: string;
  installment_number: number;
  amount: number | null;
  due_date: string | null;
  paid_date: string | null;
  slip_status: string | null;
  qt_number?: string;
  clinic_name?: string;
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('payment_installments')
        .select('id, quotation_id, installment_number, amount, due_date, paid_date, slip_status, quotations(qt_number, accounts(clinic_name))')
        .order('due_date', { ascending: false });

      setRows((data || []).map((r: any) => ({
        ...r,
        qt_number: r.quotations?.qt_number || '',
        clinic_name: r.quotations?.accounts?.clinic_name || '',
      })));
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = rows.filter(inv =>
    (inv.qt_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (inv.clinic_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ใบแจ้งหนี้</h1>
          <p className="text-sm text-muted-foreground">ใบแจ้งหนี้ทั้งหมด {filtered.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> สร้างใบแจ้งหนี้</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="ค้นหาเลขที่หรือชื่อลูกค้า..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขที่ QT</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>งวดที่</TableHead>
              <TableHead className="text-right">ยอด</TableHead>
              <TableHead>วันครบกำหนด</TableHead>
              <TableHead>วันชำระ</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.qt_number || '-'}</TableCell>
                <TableCell>{inv.clinic_name}</TableCell>
                <TableCell>{inv.installment_number}</TableCell>
                <TableCell className="text-right font-medium">฿{(inv.amount || 0).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{inv.due_date || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{inv.paid_date || '-'}</TableCell>
                <TableCell><StatusBadge status={inv.paid_date ? 'PAID' : inv.slip_status === 'PENDING' ? 'PENDING' : 'UNPAID'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

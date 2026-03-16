import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface QuotationRow {
  id: string;
  qt_number: string | null;
  account_id: string | null;
  product: string | null;
  approval_status: string | null;
  payment_status: string | null;
  clinic_name?: string;
}

export default function SalesOrdersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('quotations').select('id, qt_number, account_id, product, approval_status, payment_status, accounts(clinic_name)').order('created_at', { ascending: false });
      setRows((data || []).map((r: any) => ({ ...r, clinic_name: r.accounts?.clinic_name || '' })));
      setLoading(false);
    }
    fetch();
  }, []);

  const filtered = rows.filter(so =>
    (so.qt_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (so.clinic_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ใบสั่งขาย</h1>
          <p className="text-sm text-muted-foreground">จัดการใบสั่งขายทั้งหมด {filtered.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> สร้างใบสั่งขาย</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="ค้นหาเลขที่หรือชื่อลูกค้า..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขที่</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>สินค้า</TableHead>
              <TableHead>สถานะอนุมัติ</TableHead>
              <TableHead>การชำระ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.map(so => (
              <TableRow key={so.id}>
                <TableCell className="font-medium">{so.qt_number || so.id.slice(0, 8)}</TableCell>
                <TableCell>{so.clinic_name}</TableCell>
                <TableCell>{so.product || '-'}</TableCell>
                <TableCell><StatusBadge status={so.approval_status || 'DRAFT'} /></TableCell>
                <TableCell><StatusBadge status={so.payment_status || 'UNPAID'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

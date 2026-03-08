import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Eye, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import CreateQuotationWizard from '@/components/quotations/CreateQuotationWizard';

type ApprovalFilter = 'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalFilter>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data: quotations = [], refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, accounts!quotations_account_id_fkey(clinic_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = quotations.filter(q => {
    const matchSearch =
      (q.qt_number || '').toLowerCase().includes(search.toLowerCase()) ||
      ((q.accounts as any)?.clinic_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.product || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || q.approval_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: quotations.length,
    DRAFT: quotations.filter(q => q.approval_status === 'DRAFT').length,
    SUBMITTED: quotations.filter(q => q.approval_status === 'SUBMITTED').length,
    APPROVED: quotations.filter(q => q.approval_status === 'APPROVED').length,
    REJECTED: quotations.filter(q => q.approval_status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ใบเสนอราคา</h1>
          <p className="text-sm text-muted-foreground">จัดการใบเสนอราคาทั้งหมด {filtered.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> สร้างใบเสนอราคา
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as ApprovalFilter)}>
        <TabsList>
          <TabsTrigger value="ALL">ทั้งหมด ({counts.ALL})</TabsTrigger>
          <TabsTrigger value="DRAFT">แบบร่าง ({counts.DRAFT})</TabsTrigger>
          <TabsTrigger value="SUBMITTED">ส่งแล้ว ({counts.SUBMITTED})</TabsTrigger>
          <TabsTrigger value="APPROVED">อนุมัติ ({counts.APPROVED})</TabsTrigger>
          <TabsTrigger value="REJECTED">ไม่อนุมัติ ({counts.REJECTED})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="ค้นหาเลขที่, ลูกค้า, สินค้า..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขที่</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>สินค้า</TableHead>
              <TableHead className="text-right">ยอดรวม</TableHead>
              <TableHead>วันที่ออก</TableHead>
              <TableHead>สถานะอนุมัติ</TableHead>
              <TableHead>สถานะชำระ</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  ไม่พบข้อมูลใบเสนอราคา
                </TableCell>
              </TableRow>
            )}
            {filtered.map(q => (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(`/quotations/${q.id}`)}>
                <TableCell className="font-medium">{q.qt_number || '-'}</TableCell>
                <TableCell>{(q.accounts as any)?.clinic_name || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{q.product || '-'}</TableCell>
                <TableCell className="text-right font-medium">฿{(q.price || 0).toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{q.qt_date || '-'}</TableCell>
                <TableCell><StatusBadge status={q.approval_status || 'DRAFT'} /></TableCell>
                <TableCell><StatusBadge status={q.payment_status || 'UNPAID'} /></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateQuotationDialog open={showCreate} onOpenChange={setShowCreate} onCreated={refetch} />
    </div>
  );
}

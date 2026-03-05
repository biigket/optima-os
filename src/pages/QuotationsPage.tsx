import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { mockQuotations, getAccountById } from '@/data/mockData';

export default function QuotationsPage() {
  const [search, setSearch] = useState('');

  const filtered = mockQuotations.filter(q => {
    const account = getAccountById(q.account_id || '');
    return (q.qt_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (account?.clinic_name || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ใบเสนอราคา</h1>
          <p className="text-sm text-muted-foreground">จัดการใบเสนอราคาทั้งหมด {filtered.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> สร้างใบเสนอราคา</Button>
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
              <TableHead className="text-right">ยอดรวม</TableHead>
              <TableHead>วันที่ออก</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(q => {
              const account = getAccountById(q.account_id || '');
              return (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.qt_number}</TableCell>
                  <TableCell>{account?.clinic_name}</TableCell>
                  <TableCell className="text-muted-foreground">{q.product}</TableCell>
                  <TableCell className="text-right font-medium">฿{(q.price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{q.qt_date}</TableCell>
                  <TableCell><StatusBadge status={q.approval_status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

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
    const account = getAccountById(q.accountId);
    return q.quotationId.toLowerCase().includes(search.toLowerCase()) ||
      account?.clinicName.toLowerCase().includes(search.toLowerCase());
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
              <TableHead>รายการ</TableHead>
              <TableHead className="text-right">ยอดรวม</TableHead>
              <TableHead>วันที่ออก</TableHead>
              <TableHead>ใช้ได้ถึง</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(q => {
              const account = getAccountById(q.accountId);
              return (
                <TableRow key={q.quotationId}>
                  <TableCell className="font-medium">{q.quotationId}</TableCell>
                  <TableCell>{account?.clinicName}</TableCell>
                  <TableCell className="text-muted-foreground">{q.items.map(i => i.productName).join(', ')}</TableCell>
                  <TableCell className="text-right font-medium">฿{q.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{q.issueDate}</TableCell>
                  <TableCell className="text-muted-foreground">{q.validUntil}</TableCell>
                  <TableCell><StatusBadge status={q.approvalStatus} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

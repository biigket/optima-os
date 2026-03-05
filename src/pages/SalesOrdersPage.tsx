import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { mockSalesOrders, getAccountById } from '@/data/mockData';

export default function SalesOrdersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockSalesOrders.filter(so => {
    const account = getAccountById(so.accountId);
    return so.salesOrderId.toLowerCase().includes(search.toLowerCase()) ||
      (account?.clinic_name || '').toLowerCase().includes(search.toLowerCase());
  });

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
              <TableHead>ประเภท</TableHead>
              <TableHead>สถานะคำสั่ง</TableHead>
              <TableHead>การชำระ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(so => {
              const account = getAccountById(so.accountId);
              return (
                <TableRow key={so.salesOrderId}>
                  <TableCell className="font-medium">{so.salesOrderId}</TableCell>
                  <TableCell>{account?.clinic_name}</TableCell>
                  <TableCell><StatusBadge status={so.orderType} /></TableCell>
                  <TableCell><StatusBadge status={so.orderStatus} /></TableCell>
                  <TableCell><StatusBadge status={so.paymentStatus} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { mockInvoices, getAccountById } from '@/data/mockData';

export default function InvoicesPage() {
  const [search, setSearch] = useState('');

  const filtered = mockInvoices.filter(inv => {
    const account = getAccountById(inv.accountId);
    return inv.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      account?.clinicName.toLowerCase().includes(search.toLowerCase());
  });

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
              <TableHead>เลขที่</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead className="text-right">ยอด</TableHead>
              <TableHead>วันที่ออก</TableHead>
              <TableHead>วันครบกำหนด</TableHead>
              <TableHead>การชำระ</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(inv => {
              const account = getAccountById(inv.accountId);
              return (
                <TableRow key={inv.invoiceId}>
                  <TableCell className="font-medium">{inv.invoiceId}</TableCell>
                  <TableCell>{account?.clinicName}</TableCell>
                  <TableCell className="text-right font-medium">฿{inv.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.issueDate}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                  <TableCell><StatusBadge status={inv.paymentStatus} /></TableCell>
                  <TableCell><StatusBadge status={inv.approvalStatus} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

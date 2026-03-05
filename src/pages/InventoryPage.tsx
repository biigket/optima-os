import { useState } from 'react';
import { Search, Warehouse } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { mockInventory } from '@/data/mockData';
import type { InventoryCategory } from '@/types';

const categories: { label: string; value: InventoryCategory | 'ALL' }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'เครื่องมือ', value: 'DEVICE' },
  { label: 'วัสดุสิ้นเปลือง', value: 'CONSUMABLE' },
  { label: 'อะไหล่', value: 'PART' },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<InventoryCategory | 'ALL'>('ALL');

  const filtered = mockInventory.filter(item => {
    const matchSearch = item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouseLocation.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'ALL' || item.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">คลังสินค้า</h1>
          <p className="text-sm text-muted-foreground">สินค้าทั้งหมด {filtered.length} รายการ</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาสินค้าหรือตำแหน่ง..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {categories.map(c => (
            <Button
              key={c.value}
              variant={category === c.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สินค้า</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>Serial No.</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead>ตำแหน่ง</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(item => (
              <TableRow key={item.inventoryId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell><StatusBadge status={item.category} /></TableCell>
                <TableCell className="text-muted-foreground">{item.serialNumber || '—'}</TableCell>
                <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{item.warehouseLocation}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

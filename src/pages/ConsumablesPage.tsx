import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockConsumableInstallations, type ConsumableInstallation } from '@/data/consumableBaseMockData';
import { cartridgeTypes } from '@/data/cartridgeMockData';
import AddConsumableDialog from '@/components/consumables/AddConsumableDialog';

export default function ConsumablesPage() {
  const [items, setItems] = useState<ConsumableInstallation[]>(mockConsumableInstallations);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search ||
        item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.clinic.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'ALL' || item.cartridgeType === typeFilter;
      return matchSearch && matchType;
    });
  }, [items, search, typeFilter]);

  const today = new Date().toISOString().split('T')[0];
  const totalDelivered = items.length;
  const warrantyActive = items.filter(i => i.warrantyExpiry >= today).length;
  const warrantyExpired = items.filter(i => i.warrantyExpiry < today).length;

  const typeBreakdown = items.reduce((acc, item) => {
    acc[item.cartridgeType] = (acc[item.cartridgeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function handleAdded(item: ConsumableInstallation) {
    setItems(prev => [...prev, item]);
    mockConsumableInstallations.push(item);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">วัสดุสิ้นเปลือง</h1>
          <p className="text-sm text-muted-foreground">จัดการ Cartridge ที่ส่งมอบให้ลูกค้าแล้ว</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}><Plus size={16} className="mr-1" />ส่งมอบใหม่</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Package size={16} className="text-blue-600" /><span className="text-xs text-blue-600 font-medium">ส่งมอบแล้วทั้งหมด</span></div>
            <p className="text-2xl font-bold text-blue-800">{totalDelivered}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle size={16} className="text-emerald-600" /><span className="text-xs text-emerald-600 font-medium">ประกันยังไม่หมด</span></div>
            <p className="text-2xl font-bold text-emerald-800">{warrantyActive}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-600" /><span className="text-xs text-red-600 font-medium">ประกันหมดแล้ว</span></div>
            <p className="text-2xl font-bold text-red-800">{warrantyExpired}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Package size={16} className="text-amber-600" /><span className="text-xs text-amber-600 font-medium">ประเภท Cartridge</span></div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="outline" className="bg-amber-100 text-amber-800">{type}: {count}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหา S/N หรือคลินิก..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกประเภท</SelectItem>
            {cartridgeTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภท</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>คลินิก</TableHead>
                <TableHead>วันส่งมอบ</TableHead>
                <TableHead>ประกันหมด</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => {
                const warrantyExp = item.warrantyExpiry < today;
                return (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline" className="bg-amber-100 text-amber-800">{item.cartridgeType}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{item.serialNumber}</TableCell>
                    <TableCell className="font-medium">{item.clinic}</TableCell>
                    <TableCell className="text-sm">{item.deliveryDate}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${warrantyExp ? 'text-destructive font-medium' : ''}`}>
                        {item.warrantyExpiry}
                        {warrantyExp && ' (หมดแล้ว)'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.notes || '-'}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddConsumableDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdded={handleAdded} />
    </div>
  );
}

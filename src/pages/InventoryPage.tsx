import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Cpu, Zap, MonitorSmartphone, DollarSign, Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { mockND2Stock } from '@/data/qcMockData';
import { mockCartridgeStock } from '@/data/cartridgeMockData';
import { mockTrica3DStock } from '@/data/trica3dMockData';
import { mockQuattroStock } from '@/data/quattroMockData';
import { inventoryPrices, getPrice, setPrice } from '@/data/inventoryPricing';
import { syncReservations } from '@/data/inventoryReservation';
import type { UnifiedStockStatus } from '@/data/unifiedStockStatus';
import { unifiedStatusColor } from '@/data/unifiedStockStatus';

type ProductCategory = 'ALL' | 'ND2' | 'TRICA3D' | 'QUATTRO' | 'CARTRIDGE';

interface InventoryItem {
  id: string;
  category: ProductCategory;
  serialNumber: string;
  subInfo: string;
  storageLocation: string;
  receivedDate: string;
  detailPath: string;
  status: UnifiedStockStatus;
  reservedFor?: string;
}

const categoryTabs: { label: string; value: ProductCategory; icon: React.ReactNode }[] = [
  { label: 'ทั้งหมด', value: 'ALL', icon: <Package size={14} /> },
  { label: 'ND2', value: 'ND2', icon: <Cpu size={14} /> },
  { label: 'Trica 3D', value: 'TRICA3D', icon: <MonitorSmartphone size={14} /> },
  { label: 'Quattro', value: 'QUATTRO', icon: <Zap size={14} /> },
  { label: 'Cartridge', value: 'CARTRIDGE', icon: <DollarSign size={14} /> },
];

const categoryColor: Record<string, string> = {
  ND2: 'bg-blue-100 text-blue-800 border-blue-200',
  TRICA3D: 'bg-purple-100 text-purple-800 border-purple-200',
  QUATTRO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CARTRIDGE: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ProductCategory>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  // force re-render after price save
  const [, setTick] = useState(0);
  // Sync reservations on mount
  useEffect(() => { syncReservations(); }, []);

  // Auto-sync: pull "พร้อมขาย" และ "ติดจอง" from all QC Stock sources
  const allItems = useMemo<InventoryItem[]>(() => {
    const items: InventoryItem[] = [];

    mockND2Stock
      .filter(i => i.status === 'พร้อมขาย' || i.status === 'ติดจอง')
      .forEach(i => items.push({
        id: i.id,
        category: 'ND2',
        serialNumber: i.hntSerialNumber,
        subInfo: `HRM: ${i.hrm || '—'}`,
        storageLocation: i.storageLocation || '—',
        receivedDate: i.receivedDate || '—',
        detailPath: `/qc-stock/${i.id}`,
        status: i.status,
        reservedFor: (i as any).reservedFor,
      }));

    mockTrica3DStock
      .filter(i => i.status === 'พร้อมขาย' || i.status === 'ติดจอง')
      .forEach(i => items.push({
        id: i.id,
        category: 'TRICA3D',
        serialNumber: i.serialNumber,
        subInfo: '—',
        storageLocation: i.storageLocation || '—',
        receivedDate: i.receivedDate || '—',
        detailPath: `/qc-stock/trica3d/${i.id}`,
        status: i.status,
        reservedFor: (i as any).reservedFor,
      }));

    mockQuattroStock
      .filter(i => i.status === 'พร้อมขาย' || i.status === 'ติดจอง')
      .forEach(i => items.push({
        id: i.id,
        category: 'QUATTRO',
        serialNumber: i.serialNumber,
        subInfo: `HP: ${i.handpiece || '—'}`,
        storageLocation: i.storageLocation || '—',
        receivedDate: i.receivedDate || '—',
        detailPath: `/qc-stock/quattro/${i.id}`,
        status: i.status,
        reservedFor: (i as any).reservedFor,
      }));

    mockCartridgeStock
      .filter(i => i.status === 'พร้อมขาย' || i.status === 'ติดจอง')
      .forEach(i => items.push({
        id: i.id,
        category: 'CARTRIDGE',
        serialNumber: i.serialNumber,
        subInfo: i.cartridgeType,
        storageLocation: i.storageLocation || '—',
        receivedDate: i.receivedDate || '—',
        detailPath: `/qc-stock/cartridge/${i.id}`,
        status: i.status,
        reservedFor: (i as any).reservedFor,
      }));

    return items;
  }, []);

  const filtered = useMemo(() => {
    return allItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.subInfo.toLowerCase().includes(search.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(search.toLowerCase());
      const matchTab = tab === 'ALL' || item.category === tab;
      return matchSearch && matchTab;
    });
  }, [allItems, search, tab]);

  // KPI counts
  const kpis = useMemo(() => {
    const counts: Record<ProductCategory, number> = { ALL: allItems.length, ND2: 0, TRICA3D: 0, QUATTRO: 0, CARTRIDGE: 0 };
    const reservedCounts: Record<ProductCategory, number> = { ALL: 0, ND2: 0, TRICA3D: 0, QUATTRO: 0, CARTRIDGE: 0 };
    
    allItems.forEach(i => { 
      counts[i.category]++; 
      if (i.status === 'ติดจอง') {
        reservedCounts[i.category]++;
        reservedCounts.ALL++;
      }
    });

    const priced = allItems.filter(i => getPrice(i.id) !== null).length;
    const unpriced = allItems.length - priced;
    return { counts, priced, unpriced, reservedCounts };
  }, [allItems]);

  const kpiCards = [
    { label: 'ทั้งหมดพร้อมขาย', count: kpis.counts.ALL, color: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20', textColor: 'text-emerald-700' },
    { label: 'ND2', count: kpis.counts.ND2, color: 'from-blue-500/15 to-blue-500/5 border-blue-500/20', textColor: 'text-blue-700' },
    { label: 'Trica 3D', count: kpis.counts.TRICA3D, color: 'from-purple-500/15 to-purple-500/5 border-purple-500/20', textColor: 'text-purple-700' },
    { label: 'Quattro', count: kpis.counts.QUATTRO, color: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/20', textColor: 'text-cyan-700' },
    { label: 'Cartridge', count: kpis.counts.CARTRIDGE, color: 'from-amber-500/15 to-amber-500/5 border-amber-500/20', textColor: 'text-amber-700' },
    { label: 'ตั้งราคาแล้ว', count: kpis.priced, color: 'from-primary/15 to-primary/5 border-primary/20', textColor: 'text-primary' },
    { label: 'ยังไม่ตั้งราคา', count: kpis.unpriced, color: 'from-orange-500/15 to-orange-500/5 border-orange-500/20', textColor: 'text-orange-700' },
    { label: 'ติดจอง', count: kpis.reservedCounts.ALL, color: 'from-amber-500/20 to-amber-500/10 border-amber-500/30', textColor: 'text-amber-700' },
  ];

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    const current = getPrice(id);
    setEditPrice(current !== null ? String(current) : '');
  };

  const handleSavePrice = (id: string) => {
    const val = editPrice.trim();
    if (val === '') {
      setPrice(id, null);
    } else {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) {
        toast.error('กรุณากรอกราคาเป็นตัวเลข');
        return;
      }
      setPrice(id, num);
    }
    setEditingId(null);
    setTick(t => t + 1);
    toast.success('บันทึกราคาเรียบร้อย');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return '—';
    return price.toLocaleString('th-TH', { minimumFractionDigits: 0 }) + ' ฿';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">คลังสินค้า</h1>
        <p className="text-sm text-muted-foreground">สินค้าทั้งหมด {allItems.length} รายการ (รวม พร้อมขาย + ติดจอง)</p>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br ${kpi.color} p-3 text-center`}>
            <p className={`text-2xl font-bold ${kpi.textColor}`}>{kpi.count}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหา S/N หรือสถานที่เก็บ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {categoryTabs.map(c => (
            <Button
              key={c.value}
              variant={tab === c.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(c.value)}
              className="gap-1.5"
            >
              {c.icon} {c.label}
              {c.value !== 'ALL' && (
                <span className="ml-1 text-[10px] opacity-70">({kpis.counts[c.value]})</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สถานะ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>S/N</TableHead>
              <TableHead>ข้อมูลเพิ่มเติม</TableHead>
              <TableHead>สถานที่เก็บ</TableHead>
              <TableHead>วันที่รับเข้า</TableHead>
              <TableHead className="text-right">ราคาขาย</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  ไม่พบสินค้า
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => {
                const price = getPrice(item.id);
                const isEditing = editingId === item.id;
                const isReserved = item.status === 'ติดจอง';
                return (
                  <TableRow 
                    key={item.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${isReserved ? 'bg-amber-50/50' : ''}`} 
                    onClick={() => !isEditing && navigate(item.detailPath)}
                  >
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${unifiedStatusColor[item.status]}`}>
                        {item.status === 'ติดจอง' ? 'ติดจอง' : 'พร้อมขาย'}
                      </span>
                      {item.reservedFor && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">({item.reservedFor})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryColor[item.category]}`}>
                        {item.category === 'TRICA3D' ? 'Trica 3D' : item.category === 'CARTRIDGE' ? 'Cartridge' : item.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono font-medium text-foreground">{item.serialNumber}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.subInfo}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.storageLocation}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.receivedDate}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-28 h-7 text-right text-sm"
                            placeholder="0"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSavePrice(item.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSavePrice(item.id)}>
                            <Check size={14} className="text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEdit}>
                            <X size={14} className="text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${price !== null ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {formatPrice(price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {!isEditing && !isReserved && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(item.id)}>
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

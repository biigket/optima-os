import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Cpu, Zap, MonitorSmartphone, DollarSign, Check, X, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { inventoryPrices, getPrice, setPrice } from '@/data/inventoryPricing';
import type { UnifiedStockStatus } from '@/data/unifiedStockStatus';
import { unifiedStatusColor } from '@/data/unifiedStockStatus';
import { normalizeStatus, normalizeProductType } from '@/data/qcStockMapper';
import { supabase } from '@/integrations/supabase/client';

type ProductCategory = 'ALL' | 'ND2' | 'TRICA3D' | 'QUATTRO' | 'PICOHI' | 'FREEZERO' | 'CARTRIDGE';

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
  { label: 'Picohi', value: 'PICOHI', icon: <Zap size={14} /> },
  { label: 'Freezero', value: 'FREEZERO', icon: <Zap size={14} /> },
  { label: 'Cartridge', value: 'CARTRIDGE', icon: <DollarSign size={14} /> },
];

const categoryColor: Record<string, string> = {
  ND2: 'bg-blue-100 text-blue-800 border-blue-200',
  TRICA3D: 'bg-purple-100 text-purple-800 border-purple-200',
  QUATTRO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PICOHI: 'bg-pink-100 text-pink-800 border-pink-200',
  FREEZERO: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  CARTRIDGE: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ProductCategory>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [, setTick] = useState(0);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);

  // Fetch from Supabase: items with status พร้อมขาย or ติดจอง
  useEffect(() => {
    supabase
      .from('qc_stock_items')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;

        const categoryMap: Record<string, ProductCategory> = {
          'ND2': 'ND2',
          'TRICA 3D': 'TRICA3D',
          'QUATTRO': 'QUATTRO',
          'PICOHI300': 'PICOHI',
          'FREEZERO': 'FREEZERO',
          'CARTRIDGE': 'CARTRIDGE',
        };

        const detailPrefixMap: Record<string, string> = {
          'ND2': '/qc-stock',
          'TRICA 3D': '/qc-stock/trica3d',
          'QUATTRO': '/qc-stock/quattro',
          'PICOHI300': '/qc-stock/picohi',
          'FREEZERO': '/qc-stock/freezero',
          'CARTRIDGE': '/qc-stock/cartridge',
        };

        const items: InventoryItem[] = data
          .filter(row => {
            const status = normalizeStatus(row.status);
            return status === 'พร้อมขาย' || status === 'ติดจอง';
          })
          .map(row => {
            const pt = normalizeProductType(row.product_type);
            const cat = categoryMap[pt] || 'ND2';
            const prefix = detailPrefixMap[pt] || '/qc-stock';
            let subInfo = '—';
            if (pt === 'ND2') subInfo = `HRM: ${row.hrm || '—'}`;
            else if (pt === 'CARTRIDGE') subInfo = row.cartridge_type || '—';
            else if (['QUATTRO', 'PICOHI300', 'FREEZERO'].includes(pt)) subInfo = `HP: ${row.handpiece || '—'}`;

            return {
              id: row.id,
              category: cat,
              serialNumber: row.serial_number || '',
              subInfo,
              storageLocation: row.storage_location || '—',
              receivedDate: row.received_date || '—',
              detailPath: `${prefix}/${row.id}`,
              status: normalizeStatus(row.status),
              reservedFor: row.reserved_for || undefined,
            };
          });

        setAllItems(items);
      });
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
    const readyCounts: Record<ProductCategory, number> = { ALL: 0, ND2: 0, TRICA3D: 0, QUATTRO: 0, PICOHI: 0, FREEZERO: 0, CARTRIDGE: 0 };
    const reservedCounts: Record<ProductCategory, number> = { ALL: 0, ND2: 0, TRICA3D: 0, QUATTRO: 0, PICOHI: 0, FREEZERO: 0, CARTRIDGE: 0 };
    
    allItems.forEach(i => { 
      if (i.status === 'ติดจอง') {
        reservedCounts[i.category]++;
        reservedCounts.ALL++;
      } else {
        readyCounts[i.category]++;
        readyCounts.ALL++;
      }
    });

    const priced = allItems.filter(i => getPrice(i.id) !== null).length;
    const unpriced = allItems.length - priced;
    return { readyCounts, reservedCounts, priced, unpriced };
  }, [allItems]);

  const productTypes: { label: string; key: ProductCategory; color: string; readyText: string; reservedText: string }[] = [
    { label: 'ND2', key: 'ND2', color: 'border-blue-500/20', readyText: 'text-blue-600', reservedText: 'text-amber-600' },
    { label: 'Trica 3D', key: 'TRICA3D', color: 'border-purple-500/20', readyText: 'text-purple-600', reservedText: 'text-amber-600' },
    { label: 'Quattro', key: 'QUATTRO', color: 'border-cyan-500/20', readyText: 'text-cyan-600', reservedText: 'text-amber-600' },
    { label: 'Picohi', key: 'PICOHI', color: 'border-pink-500/20', readyText: 'text-pink-600', reservedText: 'text-amber-600' },
    { label: 'Freezero', key: 'FREEZERO', color: 'border-sky-500/20', readyText: 'text-sky-600', reservedText: 'text-amber-600' },
    { label: 'Cartridge', key: 'CARTRIDGE', color: 'border-amber-500/20', readyText: 'text-amber-700', reservedText: 'text-amber-600' },
  ];

  // ... keep existing code for handleStartEdit, handleSavePrice, handleCancelEdit, formatPrice ...

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">คลังสินค้า</h1>
        <p className="text-sm text-muted-foreground">สินค้าทั้งหมด {allItems.length} รายการ (พร้อมขาย {kpis.readyCounts.ALL} | ติดจอง {kpis.reservedCounts.ALL})</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 p-3 text-center">
          <p className="text-3xl font-bold text-emerald-700">{kpis.readyCounts.ALL}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">พร้อมขายทั้งหมด</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-amber-500/15 to-amber-500/5 border-amber-500/20 p-3 text-center">
          <p className="text-3xl font-bold text-amber-700">{kpis.reservedCounts.ALL}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">ติดจองทั้งหมด</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20 p-3 text-center">
          <p className="text-3xl font-bold text-primary">{kpis.priced}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">ตั้งราคาแล้ว</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-orange-500/15 to-orange-500/5 border-orange-500/20 p-3 text-center">
          <p className="text-3xl font-bold text-orange-700">{kpis.unpriced}</p>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">ยังไม่ตั้งราคา</p>
        </div>
      </div>

      {/* Per-product dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {productTypes.map(pt => (
          <div key={pt.key} className={`rounded-xl border ${pt.color} bg-card p-4`}>
            <p className="text-sm font-semibold text-foreground mb-2">{pt.label}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-2xl font-bold ${pt.readyText}`}>{kpis.readyCounts[pt.key]}</p>
                <p className="text-[10px] text-muted-foreground">พร้อมขาย</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${pt.reservedText}`}>{kpis.reservedCounts[pt.key]}</p>
                <p className="text-[10px] text-muted-foreground">ติดจอง</p>
              </div>
            </div>
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
              <TableHead>ชนิด</TableHead>
              <TableHead>S/N</TableHead>
              <TableHead>ประเภท</TableHead>
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
                        {item.category === 'TRICA3D' ? 'Trica 3D' : item.category === 'CARTRIDGE' ? 'Cartridge' : item.category === 'PICOHI' ? 'Picohi' : item.category === 'FREEZERO' ? 'Freezero' : item.category}
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

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, Cpu, Zap, MonitorSmartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockND2Stock, type ND2StockItem } from '@/data/qcMockData';
import { mockCartridgeStock, type CartridgeStockItem } from '@/data/cartridgeMockData';
import { mockTrica3DStock, type Trica3DStockItem } from '@/data/trica3dMockData';
import { mockQuattroStock, type QuattroStockItem } from '@/data/quattroMockData';
import { unifiedStatuses, unifiedStatusColor, type UnifiedStockStatus } from '@/data/unifiedStockStatus';
import ND2IntakeForm from '@/components/qc-stock/ND2IntakeForm';
import CartridgeIntakeForm from '@/components/qc-stock/CartridgeIntakeForm';
import Trica3DIntakeForm from '@/components/qc-stock/Trica3DIntakeForm';
import QuattroIntakeForm from '@/components/qc-stock/QuattroIntakeForm';
import { syncReservations } from '@/data/inventoryReservation';

type FilterTab = 'ALL' | UnifiedStockStatus;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  ...unifiedStatuses.map(s => ({ label: s, value: s as FilterTab })),
];

function StatusChip({ status }: { status: UnifiedStockStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${unifiedStatusColor[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

export default function QcStockPage() {
  const navigate = useNavigate();
  // ND2 state
  const [items, setItems] = useState<ND2StockItem[]>(mockND2Stock);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  // Cartridge state
  const [cartridgeItems, setCartridgeItems] = useState<CartridgeStockItem[]>(mockCartridgeStock);
  const [cartridgeSearch, setCartridgeSearch] = useState('');
  const [cartridgeFilter, setCartridgeFilter] = useState<FilterTab>('ALL');
  const [cartridgeFormOpen, setCartridgeFormOpen] = useState(false);

  // Trica 3D state
  const [trica3dItems, setTrica3dItems] = useState<Trica3DStockItem[]>(mockTrica3DStock);
  const [trica3dSearch, setTrica3dSearch] = useState('');
  const [trica3dFilter, setTrica3dFilter] = useState<FilterTab>('ALL');
  const [trica3dFormOpen, setTrica3dFormOpen] = useState(false);

  // Quattro state
  const [quattroItems, setQuattroItems] = useState<QuattroStockItem[]>(mockQuattroStock);
  const [quattroSearch, setQuattroSearch] = useState('');
  const [quattroFilter, setQuattroFilter] = useState<FilterTab>('ALL');
  const [quattroFormOpen, setQuattroFormOpen] = useState(false);

  // ND2 filters
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.hntSerialNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'ALL' || item.status === filter;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  // Counts helper
  function makeCounts(data: { status: string }[]) {
    const counts: Record<string, number> = { total: data.length };
    unifiedStatuses.forEach(s => { counts[s] = data.filter(i => i.status === s).length; });
    return counts;
  }

  const nd2Counts = useMemo(() => makeCounts(items), [items]);

  // Cartridge filters
  const filteredCartridges = useMemo(() => {
    return cartridgeItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(cartridgeSearch.toLowerCase()) ||
        item.cartridgeType.toLowerCase().includes(cartridgeSearch.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(cartridgeSearch.toLowerCase());
      const matchFilter = cartridgeFilter === 'ALL' || item.status === cartridgeFilter;
      return matchSearch && matchFilter;
    });
  }, [cartridgeItems, cartridgeSearch, cartridgeFilter]);

  // Trica 3D filters
  const filteredTrica3d = useMemo(() => {
    return trica3dItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(trica3dSearch.toLowerCase()) ||
        item.clinic.toLowerCase().includes(trica3dSearch.toLowerCase());
      const matchFilter = trica3dFilter === 'ALL' || item.status === trica3dFilter;
      return matchSearch && matchFilter;
    });
  }, [trica3dItems, trica3dSearch, trica3dFilter]);

  // Quattro filters
  const filteredQuattro = useMemo(() => {
    return quattroItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(quattroSearch.toLowerCase()) ||
        item.handpiece.toLowerCase().includes(quattroSearch.toLowerCase());
      const matchFilter = quattroFilter === 'ALL' || item.status === quattroFilter;
      return matchSearch && matchFilter;
    });
  }, [quattroItems, quattroSearch, quattroFilter]);

  const handleAddItem = (item: ND2StockItem) => { setItems(prev => [item, ...prev]); };
  const handleAddCartridge = (item: CartridgeStockItem) => { setCartridgeItems(prev => [item, ...prev]); };
  const handleAddTrica3d = (item: Trica3DStockItem) => { setTrica3dItems(prev => [item, ...prev]); };
  const handleAddQuattro = (item: QuattroStockItem) => { setQuattroItems(prev => [item, ...prev]); };

  const cartridgeCounts = useMemo(() => makeCounts(cartridgeItems), [cartridgeItems]);
  const trica3dCounts = useMemo(() => makeCounts(trica3dItems), [trica3dItems]);
  const quattroCounts = useMemo(() => makeCounts(quattroItems), [quattroItems]);

  const kpiColorMap: Record<string, string> = {
    'ทั้งหมด': 'from-primary/15 to-primary/5 border-primary/20',
    'พร้อมขาย': 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20',
    'ติดจอง': 'from-amber-500/15 to-amber-500/5 border-amber-500/20',
    'ติดตั้งแล้ว': 'from-blue-500/15 to-blue-500/5 border-blue-500/20',
    'DEMO/ยืม': 'from-yellow-500/15 to-yellow-500/5 border-yellow-500/20',
    'รอซ่อม/รอ QC': 'from-orange-500/15 to-orange-500/5 border-orange-500/20',
    'รอเคลม ตปท.': 'from-purple-500/15 to-purple-500/5 border-purple-500/20',
  };
  const kpiTextMap: Record<string, string> = {
    'ทั้งหมด': 'text-primary',
    'พร้อมขาย': 'text-emerald-700',
    'ติดตั้งแล้ว': 'text-slate-600',
    'ติดจอง': 'text-amber-700',
    'DEMO/ยืม': 'text-blue-700',
    'รอซ่อม/รอ QC': 'text-orange-700',
    'รอเคลม ตปท.': 'text-purple-700',
  };

  const buildKpis = (counts: Record<string, number>) => [
    { label: 'ทั้งหมด', value: counts.total },
    ...unifiedStatuses.map(s => ({ label: s, value: counts[s] || 0 })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QC สินค้า/สถานะสินค้า</h1>
        <p className="text-sm text-muted-foreground">ตรวจสอบและรับสินค้าเข้าคลัง</p>
      </div>

      <Tabs defaultValue="nd2" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nd2" className="gap-1.5">
            <Cpu size={14} />
            เครื่อง ND2
          </TabsTrigger>
          <TabsTrigger value="trica3d" className="gap-1.5">
            <MonitorSmartphone size={14} />
            เครื่อง Trica 3D
          </TabsTrigger>
          <TabsTrigger value="quattro" className="gap-1.5">
            <Package size={14} />
            เครื่อง Quattro
          </TabsTrigger>
          <TabsTrigger value="cartridge" className="gap-1.5">
            <Zap size={14} />
            วัสดุสิ้นเปลือง Cartridge
          </TabsTrigger>
        </TabsList>

        {/* ==================== ND2 Tab ==================== */}
        <TabsContent value="nd2" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus size={16} />
              รับเข้า Stock ND2
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {buildKpis(nd2Counts).map(kpi => (
              <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, สถานที่..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={filter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HNT S/N</TableHead>
                  <TableHead>HFL</TableHead>
                  <TableHead>HSD</TableHead>
                  <TableHead>HRM</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>วันรับเข้า</TableHead>
                  <TableHead>ที่เก็บ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/${item.id}`)}>
                      <TableCell className="font-mono font-medium text-foreground">{item.hntSerialNumber}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hfl1}</div>
                        <div>{item.hfl2}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hsd1}</div>
                        <div>{item.hsd2}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hrm}</div>
                        <div className="text-[10px]">({item.hrmSellOrKeep})</div>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                        {item.qcFailReason && (
                          <p className="text-[10px] text-destructive mt-0.5">{item.qcFailReason}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.receivedDate || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.storageLocation || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ==================== Trica 3D Tab ==================== */}
        <TabsContent value="trica3d" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTrica3dFormOpen(true)} className="gap-2">
              <Plus size={16} />
              รับ Trica 3D เข้า Stock
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {buildKpis(trica3dCounts).map(kpi => (
              <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, คลินิก..." value={trica3dSearch} onChange={e => setTrica3dSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={trica3dFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTrica3dFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N Trica</TableHead>
                  <TableHead>Clinic</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>วันรับเข้า Stock</TableHead>
                  <TableHead>วันที่ติดตั้ง</TableHead>
                  <TableHead>สาเหตุเสีย</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead>เก็บที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrica3d.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      ยังไม่มีข้อมูล Trica 3D — กด "รับ Trica 3D เข้า Stock" เพื่อเพิ่ม
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrica3d.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/trica3d/${item.id}`)}>
                      <TableCell className="font-mono font-medium text-foreground text-xs">{item.serialNumber}</TableCell>
                      <TableCell className="text-sm">{item.clinic || '—'}</TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.receivedDate || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.installDate || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{item.failReason || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.notes || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.storageLocation || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ==================== Cartridge Tab ==================== */}
        <TabsContent value="cartridge" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCartridgeFormOpen(true)} className="gap-2">
              <Plus size={16} />
              รับ Cartridge เข้า Stock
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {buildKpis(cartridgeCounts).map(kpi => (
              <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, ประเภท, สถานที่..." value={cartridgeSearch} onChange={e => setCartridgeSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={cartridgeFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCartridgeFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cartridge S/N</TableHead>
                  <TableHead>Cartridge</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead>วันที่รับเข้า Stock</TableHead>
                  <TableHead>เก็บที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCartridges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      ยังไม่มีข้อมูล Cartridge — กด "รับ Cartridge เข้า Stock" เพื่อเพิ่ม
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCartridges.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/cartridge/${item.id}`)}>
                      <TableCell className="font-mono font-medium text-foreground">{item.serialNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{item.cartridgeType}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.qcFailReason || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.receivedDate || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.storageLocation || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ==================== Quattro Tab ==================== */}
        <TabsContent value="quattro" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setQuattroFormOpen(true)} className="gap-2">
              <Plus size={16} />
              รับ Quattro เข้า Stock
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {buildKpis(quattroCounts).map(kpi => (
              <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, Handpiece..." value={quattroSearch} onChange={e => setQuattroSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={quattroFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuattroFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Handpiece</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>เครื่องเสียเพราะ?</TableHead>
                  <TableHead>วันที่รับเข้า Stock</TableHead>
                  <TableHead>เก็บที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuattro.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      ยังไม่มีข้อมูล Quattro — กด "รับ Quattro เข้า Stock" เพื่อเพิ่ม
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuattro.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/quattro/${item.id}`)}>
                      <TableCell className="font-mono font-medium text-foreground">{item.serialNumber}</TableCell>
                      <TableCell className="text-sm">{item.handpiece || '—'}</TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.failReason || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.receivedDate || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.storageLocation || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ND2IntakeForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAddItem} />
      <CartridgeIntakeForm open={cartridgeFormOpen} onOpenChange={setCartridgeFormOpen} onSubmit={handleAddCartridge} />
      <Trica3DIntakeForm open={trica3dFormOpen} onOpenChange={setTrica3dFormOpen} onSubmit={handleAddTrica3d} />
      <QuattroIntakeForm open={quattroFormOpen} onOpenChange={setQuattroFormOpen} onSubmit={handleAddQuattro} />
    </div>
  );
}

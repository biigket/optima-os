import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Package, Cpu, Zap, MonitorSmartphone, Snowflake, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { ND2StockItem, CartridgeStockItem, Trica3DStockItem, QuattroStockItem, PicohiStockItem, FreezeroStockItem } from '@/types/stock';
import { unifiedStatuses, unifiedStatusColor, type UnifiedStockStatus } from '@/data/unifiedStockStatus';
import { mapND2, mapTrica3D, mapGenericStock, mapCartridge, normalizeProductType } from '@/data/qcStockMapper';
import { supabase } from '@/integrations/supabase/client';
import ND2IntakeForm from '@/components/qc-stock/ND2IntakeForm';
import CartridgeIntakeForm from '@/components/qc-stock/CartridgeIntakeForm';
import Trica3DIntakeForm from '@/components/qc-stock/Trica3DIntakeForm';
import QuattroIntakeForm from '@/components/qc-stock/QuattroIntakeForm';
import PicohiIntakeForm from '@/components/qc-stock/PicohiIntakeForm';
import FreezeroIntakeForm from '@/components/qc-stock/FreezeroIntakeForm';

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
  const [items, setItems] = useState<ND2StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  // Cartridge state
  const [cartridgeItems, setCartridgeItems] = useState<CartridgeStockItem[]>([]);
  const [cartridgeSearch, setCartridgeSearch] = useState('');
  const [cartridgeFilter, setCartridgeFilter] = useState<FilterTab>('ALL');
  const [cartridgeFormOpen, setCartridgeFormOpen] = useState(false);

  // Trica 3D state
  const [trica3dItems, setTrica3dItems] = useState<Trica3DStockItem[]>([]);
  const [trica3dSearch, setTrica3dSearch] = useState('');
  const [trica3dFilter, setTrica3dFilter] = useState<FilterTab>('ALL');
  const [trica3dFormOpen, setTrica3dFormOpen] = useState(false);

  // Quattro state
  const [quattroItems, setQuattroItems] = useState<QuattroStockItem[]>([]);
  const [quattroSearch, setQuattroSearch] = useState('');
  const [quattroFilter, setQuattroFilter] = useState<FilterTab>('ALL');
  const [quattroFormOpen, setQuattroFormOpen] = useState(false);

  // Picohi state
  const [picohiItems, setPicohiItems] = useState<PicohiStockItem[]>([]);
  const [picohiSearch, setPicohiSearch] = useState('');
  const [picohiFilter, setPicohiFilter] = useState<FilterTab>('ALL');
  const [picohiFormOpen, setPicohiFormOpen] = useState(false);

  // Freezero state
  const [freezeroItems, setFreezeroItems] = useState<FreezeroStockItem[]>([]);
  const [freezeroSearch, setFreezeroSearch] = useState('');
  const [freezeroFilter, setFreezeroFilter] = useState<FilterTab>('ALL');
  const [freezeroFormOpen, setFreezeroFormOpen] = useState(false);

  // Fetch all stock from DB
  useEffect(() => {
    supabase.from('qc_stock_items').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (!data) return;
      const normalized = data.map(r => ({ ...r, _pt: normalizeProductType(r.product_type) }));
      setItems(normalized.filter(r => r._pt === 'ND2').map(mapND2));
      setCartridgeItems(normalized.filter(r => r._pt === 'CARTRIDGE').map(mapCartridge));
      setTrica3dItems(normalized.filter(r => r._pt === 'TRICA 3D').map(mapTrica3D));
      setQuattroItems(normalized.filter(r => r._pt === 'QUATTRO').map(mapGenericStock));
      setPicohiItems(normalized.filter(r => r._pt === 'PICOHI300').map(mapGenericStock));
      setFreezeroItems(normalized.filter(r => r._pt === 'FREEZERO').map(mapGenericStock));
    });
  }, []);

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

  // Picohi filters
  const filteredPicohi = useMemo(() => {
    return picohiItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(picohiSearch.toLowerCase()) ||
        item.handpiece.toLowerCase().includes(picohiSearch.toLowerCase());
      const matchFilter = picohiFilter === 'ALL' || item.status === picohiFilter;
      return matchSearch && matchFilter;
    });
  }, [picohiItems, picohiSearch, picohiFilter]);

  // Freezero filters
  const filteredFreezero = useMemo(() => {
    return freezeroItems.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(freezeroSearch.toLowerCase()) ||
        item.handpiece.toLowerCase().includes(freezeroSearch.toLowerCase());
      const matchFilter = freezeroFilter === 'ALL' || item.status === freezeroFilter;
      return matchSearch && matchFilter;
    });
  }, [freezeroItems, freezeroSearch, freezeroFilter]);

  const handleAddItem = (item: ND2StockItem) => { setItems(prev => [item, ...prev]); };
  const handleAddCartridge = (item: CartridgeStockItem) => { setCartridgeItems(prev => [item, ...prev]); };
  const handleAddTrica3d = (item: Trica3DStockItem) => { setTrica3dItems(prev => [item, ...prev]); };
  const handleAddQuattro = (item: QuattroStockItem) => { setQuattroItems(prev => [item, ...prev]); };
  const handleAddPicohi = (item: PicohiStockItem) => { setPicohiItems(prev => [item, ...prev]); };
  const handleAddFreezero = (item: FreezeroStockItem) => { setFreezeroItems(prev => [item, ...prev]); };

  const cartridgeCounts = useMemo(() => makeCounts(cartridgeItems), [cartridgeItems]);
  const trica3dCounts = useMemo(() => makeCounts(trica3dItems), [trica3dItems]);
  const quattroCounts = useMemo(() => makeCounts(quattroItems), [quattroItems]);
  const picohiCounts = useMemo(() => makeCounts(picohiItems), [picohiItems]);
  const freezeroCounts = useMemo(() => makeCounts(freezeroItems), [freezeroItems]);

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

  // Reusable tab content for Quattro-like products (S/N, Handpiece, STATUS, failReason, receivedDate, storageLocation)
  const renderSimpleDeviceTab = (
    label: string,
    filteredData: { id: string; serialNumber: string; handpiece: string; status: UnifiedStockStatus; failReason: string; receivedDate: string; storageLocation: string; notes: string }[],
    counts: Record<string, number>,
    searchVal: string,
    setSearchVal: (v: string) => void,
    filterVal: FilterTab,
    setFilterVal: (v: FilterTab) => void,
    setFormOpenFn: (v: boolean) => void,
    detailPrefix: string,
  ) => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpenFn(true)} className="gap-2">
          <Plus size={16} />
          รับ {label} เข้า Stock
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {buildKpis(counts).map(kpi => (
          <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
            <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
            <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหา S/N, Handpiece..." value={searchVal} onChange={e => setSearchVal(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filterTabs.map(tab => (
            <Button key={tab.value} variant={filterVal === tab.value ? 'default' : 'outline'} size="sm" onClick={() => setFilterVal(tab.value)}>
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
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  ยังไม่มีข้อมูล {label} — กด "รับ {label} เข้า Stock" เพื่อเพิ่ม
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/${detailPrefix}/${item.id}`)}>
                  <TableCell className="font-mono font-medium text-foreground">{item.serialNumber}</TableCell>
                  <TableCell className="text-sm">{item.handpiece || '—'}</TableCell>
                  <TableCell><StatusChip status={item.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.failReason || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.receivedDate || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.storageLocation || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QC สินค้า/สถานะสินค้า</h1>
        <p className="text-sm text-muted-foreground">ตรวจสอบและรับสินค้าเข้าคลัง</p>
      </div>

      <Tabs defaultValue="nd2" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nd2" className="gap-1.5"><Cpu size={14} /> เครื่อง ND2</TabsTrigger>
          <TabsTrigger value="trica3d" className="gap-1.5"><MonitorSmartphone size={14} /> เครื่อง Trica 3D</TabsTrigger>
          <TabsTrigger value="quattro" className="gap-1.5"><Package size={14} /> เครื่อง Quattro</TabsTrigger>
          <TabsTrigger value="picohi" className="gap-1.5"><Sparkles size={14} /> เครื่อง Picohi</TabsTrigger>
          <TabsTrigger value="freezero" className="gap-1.5"><Snowflake size={14} /> เครื่อง Freezero</TabsTrigger>
          <TabsTrigger value="cartridge" className="gap-1.5"><Zap size={14} /> วัสดุสิ้นเปลือง Cartridge</TabsTrigger>
        </TabsList>

        {/* ==================== ND2 Tab ==================== */}
        <TabsContent value="nd2" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus size={16} /> รับเข้า Stock ND2
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {buildKpis(nd2Counts).map(kpi => (
              <div key={kpi.label} className={`rounded-xl border bg-gradient-to-br p-3 space-y-1 ${kpiColorMap[kpi.label] || ''}`}>
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <p className={`text-2xl font-bold ${kpiTextMap[kpi.label] || 'text-foreground'}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, สถานที่..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {filterTabs.map(tab => (
                <Button key={tab.value} variant={filter === tab.value ? 'default' : 'outline'} size="sm" onClick={() => setFilter(tab.value)}>
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(item => (
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/qc-stock/${item.id}`)}>
                      <TableCell className="font-mono font-medium text-foreground">{item.hntSerialNumber}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hfl1}</div><div>{item.hfl2}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hsd1}</div><div>{item.hsd2}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <div>{item.hrm}</div><div className="text-[10px]">({item.hrmSellOrKeep})</div>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={item.status} />
                        {item.qcFailReason && <p className="text-[10px] text-destructive mt-0.5">{item.qcFailReason}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.receivedDate || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.storageLocation || '—'}</TableCell>
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
              <Plus size={16} /> รับ Trica 3D เข้า Stock
            </Button>
          </div>

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
                <Button key={tab.value} variant={trica3dFilter === tab.value ? 'default' : 'outline'} size="sm" onClick={() => setTrica3dFilter(tab.value)}>
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

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
                      <TableCell><StatusChip status={item.status} /></TableCell>
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
              <Plus size={16} /> รับ Cartridge เข้า Stock
            </Button>
          </div>

          {/* Cartridge type breakdown - พร้อมขาย */}
          {(() => {
            const typeCounts: Record<string, number> = {};
            cartridgeItems.forEach(item => {
              if (item.status === 'พร้อมขาย') {
                typeCounts[item.cartridgeType] = (typeCounts[item.cartridgeType] || 0) + 1;
              }
            });
            const typeOrder = ['A2.0', 'A3.0', 'A4.5', 'A6.0', 'L1.5', 'L3.0', 'L4.5', 'L9.0', 'N49', 'I49', 'N25', 'I25'];
            const typeColors: Record<string, { bg: string; text: string }> = {
              'A2.0': { bg: 'from-sky-500/10 to-sky-500/5 border-sky-500/20', text: 'text-sky-600' },
              'A3.0': { bg: 'from-blue-500/10 to-blue-500/5 border-blue-500/20', text: 'text-blue-600' },
              'A4.5': { bg: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20', text: 'text-indigo-600' },
              'A6.0': { bg: 'from-amber-500/10 to-amber-500/5 border-amber-500/20', text: 'text-amber-600' },
              'L1.5': { bg: 'from-orange-500/10 to-orange-500/5 border-orange-500/20', text: 'text-orange-600' },
              'L3.0': { bg: 'from-blue-500/10 to-blue-500/5 border-blue-500/20', text: 'text-blue-600' },
              'L4.5': { bg: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20', text: 'text-indigo-600' },
              'L9.0': { bg: 'from-amber-500/10 to-amber-500/5 border-amber-500/20', text: 'text-amber-600' },
              'N49': { bg: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20', text: 'text-emerald-600' },
              'I49': { bg: 'from-teal-500/10 to-teal-500/5 border-teal-500/20', text: 'text-teal-600' },
              'N25': { bg: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20', text: 'text-cyan-600' },
              'I25': { bg: 'from-purple-500/10 to-purple-500/5 border-purple-500/20', text: 'text-purple-600' },
            };
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {typeOrder.map(type => {
                  const count = typeCounts[type] || 0;
                  const colors = typeColors[type] || { bg: 'from-muted to-muted border-border', text: 'text-foreground' };
                  return (
                    <div key={type} className={`rounded-xl border bg-gradient-to-br ${colors.bg} p-3`}>
                      <p className="text-xs font-medium text-muted-foreground">{type} พร้อมขาย</p>
                      <p className={`text-3xl font-bold ${colors.text} mt-1`}>{count}</p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

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
                <Button key={tab.value} variant={cartridgeFilter === tab.value ? 'default' : 'outline'} size="sm" onClick={() => setCartridgeFilter(tab.value)}>
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

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
                      <TableCell><Badge variant="outline" className="font-mono">{item.cartridgeType}</Badge></TableCell>
                      <TableCell><StatusChip status={item.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.qcFailReason || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.receivedDate || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.storageLocation || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ==================== Quattro Tab ==================== */}
        <TabsContent value="quattro">
          {renderSimpleDeviceTab('Quattro', filteredQuattro, quattroCounts, quattroSearch, setQuattroSearch, quattroFilter, setQuattroFilter, setQuattroFormOpen, 'quattro')}
        </TabsContent>

        {/* ==================== Picohi Tab ==================== */}
        <TabsContent value="picohi">
          {renderSimpleDeviceTab('Picohi', filteredPicohi, picohiCounts, picohiSearch, setPicohiSearch, picohiFilter, setPicohiFilter, setPicohiFormOpen, 'picohi')}
        </TabsContent>

        {/* ==================== Freezero Tab ==================== */}
        <TabsContent value="freezero">
          {renderSimpleDeviceTab('Freezero', filteredFreezero, freezeroCounts, freezeroSearch, setFreezeroSearch, freezeroFilter, setFreezeroFilter, setFreezeroFormOpen, 'freezero')}
        </TabsContent>
      </Tabs>

      <ND2IntakeForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAddItem} />
      <CartridgeIntakeForm open={cartridgeFormOpen} onOpenChange={setCartridgeFormOpen} onSubmit={handleAddCartridge} />
      <Trica3DIntakeForm open={trica3dFormOpen} onOpenChange={setTrica3dFormOpen} onSubmit={handleAddTrica3d} />
      <QuattroIntakeForm open={quattroFormOpen} onOpenChange={setQuattroFormOpen} onSubmit={handleAddQuattro} />
      <PicohiIntakeForm open={picohiFormOpen} onOpenChange={setPicohiFormOpen} onSubmit={handleAddPicohi} />
      <FreezeroIntakeForm open={freezeroFormOpen} onOpenChange={setFreezeroFormOpen} onSubmit={handleAddFreezero} />
    </div>
  );
}

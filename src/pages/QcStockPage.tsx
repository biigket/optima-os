import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ClipboardCheck, CheckCircle2, XCircle, Clock, Package, Cpu, Zap, MonitorSmartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockND2Stock, type ND2StockItem, type QcStatus } from '@/data/qcMockData';
import { mockCartridgeStock, type CartridgeStockItem, type CartridgeStatus } from '@/data/cartridgeMockData';
import { mockTrica3DStock, type Trica3DStockItem, type Trica3DStatus } from '@/data/trica3dMockData';
import ND2IntakeForm from '@/components/qc-stock/ND2IntakeForm';
import CartridgeIntakeForm from '@/components/qc-stock/CartridgeIntakeForm';
import Trica3DIntakeForm from '@/components/qc-stock/Trica3DIntakeForm';

type FilterTab = 'ALL' | QcStatus;

const filterTabs: { label: string; value: FilterTab; icon: React.ElementType }[] = [
  { label: 'ทั้งหมด', value: 'ALL', icon: Package },
  { label: 'พร้อมขาย', value: 'QC_PASSED', icon: CheckCircle2 },
  { label: 'QC ไม่ผ่าน', value: 'QC_FAILED', icon: XCircle },
  { label: 'รอ QC', value: 'PENDING_QC', icon: Clock },
];

type CartridgeFilterTab = 'ALL' | CartridgeStatus;

const cartridgeFilterTabs: { label: string; value: CartridgeFilterTab }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'พร้อมขาย', value: 'พร้อมขาย' },
  { label: 'ขายแล้ว', value: 'ขายแล้ว' },
  { label: 'ไม่ผ่าน QC', value: 'ไม่ผ่าน QC' },
  { label: 'DEMO', value: 'DEMO' },
  { label: 'Claim', value: 'Claim' },
];

const cartridgeStatusColor: Record<CartridgeStatus, string> = {
  'พร้อมขาย': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ขายแล้ว': 'bg-muted text-muted-foreground border-border',
  'ไม่ผ่าน QC': 'bg-destructive/10 text-destructive border-destructive/20',
  'DEMO': 'bg-blue-100 text-blue-800 border-blue-200',
  'Claim': 'bg-amber-100 text-amber-800 border-amber-200',
  'Support KOL': 'bg-purple-100 text-purple-800 border-purple-200',
};

const trica3dStatusColor: Record<Trica3DStatus, string> = {
  'พร้อมขาย': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ติดตั้งแล้ว': 'bg-muted text-muted-foreground border-border',
  'ติดจอง': 'bg-amber-100 text-amber-800 border-amber-200',
  'DEMO': 'bg-blue-100 text-blue-800 border-blue-200',
  'ยืม': 'bg-purple-100 text-purple-800 border-purple-200',
  'เครื่องเสีย': 'bg-destructive/10 text-destructive border-destructive/20',
};

type Trica3DFilterTab = 'ALL' | Trica3DStatus;

const trica3dFilterTabs: { label: string; value: Trica3DFilterTab }[] = [
  { label: 'ทั้งหมด', value: 'ALL' },
  { label: 'พร้อมขาย', value: 'พร้อมขาย' },
  { label: 'ติดตั้งแล้ว', value: 'ติดตั้งแล้ว' },
  { label: 'ติดจอง', value: 'ติดจอง' },
  { label: 'DEMO', value: 'DEMO' },
  { label: 'ยืม', value: 'ยืม' },
  { label: 'เครื่องเสีย', value: 'เครื่องเสีย' },
];

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
  const [cartridgeFilter, setCartridgeFilter] = useState<CartridgeFilterTab>('ALL');
  const [cartridgeFormOpen, setCartridgeFormOpen] = useState(false);

  // Trica 3D state
  const [trica3dItems, setTrica3dItems] = useState<Trica3DStockItem[]>(mockTrica3DStock);
  const [trica3dSearch, setTrica3dSearch] = useState('');
  const [trica3dFilter, setTrica3dFilter] = useState<Trica3DFilterTab>('ALL');
  const [trica3dFormOpen, setTrica3dFormOpen] = useState(false);

  // ND2 filters
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.hntSerialNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'ALL' || item.qcResult === filter;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  const counts = useMemo(() => ({
    total: items.length,
    passed: items.filter(i => i.qcResult === 'QC_PASSED').length,
    failed: items.filter(i => i.qcResult === 'QC_FAILED').length,
    pending: items.filter(i => i.qcResult === 'PENDING_QC').length,
    readyToSell: items.filter(i => i.status === 'READY_TO_SELL').length,
    installed: items.filter(i => i.status === 'INSTALLED').length,
  }), [items]);

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

  const handleAddItem = (item: ND2StockItem) => {
    setItems(prev => [item, ...prev]);
  };

  const handleAddCartridge = (item: CartridgeStockItem) => {
    setCartridgeItems(prev => [item, ...prev]);
  };

  const handleAddTrica3d = (item: Trica3DStockItem) => {
    setTrica3dItems(prev => [item, ...prev]);
  };

  const kpis = [
    { label: 'ทั้งหมด', value: counts.total, icon: Package, color: 'text-primary' },
    { label: 'พร้อมขาย', value: counts.passed, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'QC ไม่ผ่าน', value: counts.failed, icon: XCircle, color: 'text-destructive' },
    { label: 'รอ QC', value: counts.pending, icon: Clock, color: 'text-amber-600' },
    { label: 'พร้อมขาย', value: counts.readyToSell, icon: Cpu, color: 'text-blue-600' },
    { label: 'ติดตั้งแล้ว', value: counts.installed, icon: ClipboardCheck, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QC สินค้า</h1>
        <p className="text-sm text-muted-foreground">ตรวจสอบและรับสินค้าเข้าคลัง</p>
      </div>

      <Tabs defaultValue="nd2" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nd2" className="gap-1.5">
            <Cpu size={14} />
            เครื่อง ND2
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map(kpi => (
              <div key={kpi.label} className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <kpi.icon size={16} className={kpi.color} />
                  <span className="text-xs text-muted-foreground">{kpi.label}</span>
                </div>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, สถานที่..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1">
              {filterTabs.map(tab => (
                <Button
                  key={tab.value}
                  variant={filter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(tab.value)}
                  className="gap-1.5"
                >
                  <tab.icon size={14} />
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
                  <TableHead>QC</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>วันรับเข้า</TableHead>
                  <TableHead>ที่เก็บ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                        <StatusBadge status={item.qcResult} />
                        {item.qcResult === 'QC_FAILED' && item.qcFailReason && (
                          <p className="text-[10px] text-destructive mt-0.5">{item.qcFailReason}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
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

        {/* ==================== Cartridge Tab ==================== */}
        <TabsContent value="cartridge" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCartridgeFormOpen(true)} className="gap-2">
              <Plus size={16} />
              รับ Cartridge เข้า Stock
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหา S/N, ประเภท, สถานที่..." value={cartridgeSearch} onChange={e => setCartridgeSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {cartridgeFilterTabs.map(tab => (
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
                  <TableHead>สาเหตุไม่ผ่าน QC</TableHead>
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
                    <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono font-medium text-foreground">{item.serialNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{item.cartridgeType}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cartridgeStatusColor[item.status] || 'bg-muted text-muted-foreground'}`}>
                          {item.status}
                        </span>
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
      </Tabs>

      <ND2IntakeForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAddItem} />
      <CartridgeIntakeForm open={cartridgeFormOpen} onOpenChange={setCartridgeFormOpen} onSubmit={handleAddCartridge} />
    </div>
  );
}

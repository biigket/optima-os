import { useState, useMemo } from 'react';
import { Search, Plus, ClipboardCheck, CheckCircle2, XCircle, Clock, Package, Cpu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { mockND2Stock, type ND2StockItem, type QcStatus, type StockStatus } from '@/data/qcMockData';
import ND2IntakeForm from '@/components/qc-stock/ND2IntakeForm';

const qcStatusLabel: Record<QcStatus, string> = {
  QC_PASSED: 'QC ผ่าน',
  QC_FAILED: 'QC ไม่ผ่าน',
  PENDING_QC: 'รอ QC',
};

const stockStatusLabel: Record<StockStatus, string> = {
  READY_TO_SELL: 'พร้อมขาย',
  RESERVED: 'ติดจอง',
  INSTALLED: 'ติดตั้งแล้ว',
  SENT_FOR_REPAIR: 'ส่งซ่อม',
};

type FilterTab = 'ALL' | QcStatus;

const filterTabs: { label: string; value: FilterTab; icon: React.ElementType }[] = [
  { label: 'ทั้งหมด', value: 'ALL', icon: Package },
  { label: 'QC ผ่าน', value: 'QC_PASSED', icon: CheckCircle2 },
  { label: 'QC ไม่ผ่าน', value: 'QC_FAILED', icon: XCircle },
  { label: 'รอ QC', value: 'PENDING_QC', icon: Clock },
];

export default function QcStockPage() {
  const [items, setItems] = useState<ND2StockItem[]>(mockND2Stock);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.hntSerialNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.clinic.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleAddItem = (item: ND2StockItem) => {
    setItems(prev => [item, ...prev]);
  };

  const kpis = [
    { label: 'ทั้งหมด', value: counts.total, icon: Package, color: 'text-primary' },
    { label: 'QC ผ่าน', value: counts.passed, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'QC ไม่ผ่าน', value: counts.failed, icon: XCircle, color: 'text-destructive' },
    { label: 'รอ QC', value: counts.pending, icon: Clock, color: 'text-amber-600' },
    { label: 'พร้อมขาย', value: counts.readyToSell, icon: Cpu, color: 'text-blue-600' },
    { label: 'ติดตั้งแล้ว', value: counts.installed, icon: ClipboardCheck, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QC สินค้า</h1>
          <p className="text-sm text-muted-foreground">ตรวจสอบและรับสินค้าเข้าคลัง</p>
        </div>
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
          <Input placeholder="ค้นหา S/N, คลินิก, สถานที่..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
              <TableHead>Clinic / จอง</TableHead>
              <TableHead>วันรับเข้า</TableHead>
              <TableHead>ที่เก็บ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id}>
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
                  <TableCell className="text-sm">
                    {item.clinic || item.reservedFor || '—'}
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

      <ND2IntakeForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleAddItem} />
    </div>
  );
}

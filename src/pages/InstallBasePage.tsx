import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Cpu, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AddInstallationDialog from '@/components/install-base/AddInstallationDialog';
import type { Installation } from '@/data/installBaseMockData';

interface InstallRow {
  id: string;
  serial_number: string;
  account_id: string | null;
  product_id: string | null;
  install_date: string | null;
  warranty_days: number | null;
  warranty_expiry: string | null;
  province: string | null;
  region: string | null;
  status: string | null;
  clinic_name?: string;
  product_name?: string;
}

interface PMRow {
  id: string;
  installation_id: string;
  maintenance_number: number;
  scheduled_date: string | null;
  status: string | null;
}

export default function InstallBasePage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<InstallRow[]>([]);
  const [pmMap, setPmMap] = useState<Record<string, PMRow[]>>({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [instRes, pmRes] = await Promise.all([
      supabase.from('installations').select('*, accounts(clinic_name), products(product_name)').order('created_at', { ascending: false }),
      supabase.from('maintenance_records').select('id, installation_id, maintenance_number, scheduled_date, status'),
    ]);

    const instData = (instRes.data || []).map((r: any) => ({
      ...r,
      clinic_name: r.accounts?.clinic_name || '',
      product_name: r.products?.product_name || '',
    }));
    setRows(instData);

    const map: Record<string, PMRow[]> = {};
    (pmRes.data || []).forEach((pm: any) => {
      if (!map[pm.installation_id]) map[pm.installation_id] = [];
      map[pm.installation_id].push(pm);
    });
    setPmMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(inst => {
      const matchSearch = !search ||
        (inst.serial_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (inst.clinic_name || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || (inst.product_name || '').toUpperCase().includes(categoryFilter.toUpperCase());
      return matchSearch && matchCategory;
    });
  }, [rows, search, categoryFilter]);

  function getPMStatus(instId: string, installDate: string | null) {
    const pms = pmMap[instId] || [];
    const completedCount = pms.filter(r => r.status === 'COMPLETED').length;
    const today = new Date().toISOString().split('T')[0];
    const pendingPMs = pms.filter(p => p.status === 'PENDING').sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''));
    const nextPM = pendingPMs[0];
    const isOverdue = nextPM && nextPM.scheduled_date && nextPM.scheduled_date < today;
    return { completedCount, totalScheduled: pms.length, nextPM, isOverdue };
  }

  const totalInstalled = rows.length;
  const today = new Date().toISOString().split('T')[0];
  const overdueCount = rows.filter(inst => getPMStatus(inst.id, inst.install_date).isOverdue).length;
  const warrantyActive = rows.filter(inst => inst.warranty_expiry && inst.warranty_expiry >= today).length;

  const categoryBreakdown = rows.reduce((acc, inst) => {
    const cat = inst.product_name || 'อื่นๆ';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    'ND2': 'bg-indigo-100 text-indigo-800',
    'TRICA 3D': 'bg-violet-100 text-violet-800',
    'QUATTRO': 'bg-teal-100 text-teal-800',
    'PICOHI300': 'bg-pink-100 text-pink-800',
    'FREEZERO': 'bg-cyan-100 text-cyan-800',
  };

  function getCategoryColor(name: string) {
    const upper = (name || '').toUpperCase();
    for (const [key, val] of Object.entries(categoryColors)) {
      if (upper.includes(key)) return val;
    }
    return 'bg-muted text-muted-foreground';
  }

  function handleInstalled(inst: Installation) {
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Install Base</h1>
          <p className="text-sm text-muted-foreground">จัดการเครื่องที่ติดตั้งแล้วและ Preventive Maintenance</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}><Plus size={16} className="mr-1" />ลงติดตั้งใหม่</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Cpu size={16} className="text-blue-600" /><span className="text-xs text-blue-600 font-medium">เครื่องติดตั้งทั้งหมด</span></div>
            <p className="text-2xl font-bold text-blue-800">{totalInstalled}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle size={16} className="text-emerald-600" /><span className="text-xs text-emerald-600 font-medium">ประกันยังไม่หมด</span></div>
            <p className="text-2xl font-bold text-emerald-800">{warrantyActive}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-orange-600" /><span className="text-xs text-orange-600 font-medium">PM เกินกำหนด</span></div>
            <p className="text-2xl font-bold text-orange-800">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100/50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Wrench size={16} className="text-violet-600" /><span className="text-xs text-violet-600 font-medium">ประเภทสินค้า</span></div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(categoryBreakdown).map(([cat, count]) => (
                <Badge key={cat} variant="outline" className={getCategoryColor(cat)}>{cat}: {count}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหา S/N หรือคลินิก..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกประเภท</SelectItem>
            <SelectItem value="ND2">ND2</SelectItem>
            <SelectItem value="TRICA">Trica 3D</SelectItem>
            <SelectItem value="QUATTRO">Quattro</SelectItem>
            <SelectItem value="PICOHI">Picohi</SelectItem>
            <SelectItem value="FREEZERO">Freezero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภท</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>คลินิก</TableHead>
                <TableHead>วันติดตั้ง</TableHead>
                <TableHead>ประกันหมด</TableHead>
                <TableHead>จังหวัด</TableHead>
                <TableHead>PM Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
              ) : filtered.map(inst => {
                const pm = getPMStatus(inst.id, inst.install_date);
                const warrantyExpired = inst.warranty_expiry ? inst.warranty_expiry < today : false;
                return (
                  <TableRow
                    key={inst.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/install-base/${inst.id}`)}
                  >
                    <TableCell><Badge className={getCategoryColor(inst.product_name || '')} variant="outline">{inst.product_name || '-'}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{inst.serial_number || '-'}</TableCell>
                    <TableCell className="font-medium">{inst.clinic_name || '-'}</TableCell>
                    <TableCell className="text-sm">{inst.install_date || '-'}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${warrantyExpired ? 'text-red-600 font-medium' : ''}`}>
                        {inst.warranty_expiry || '-'}
                        {warrantyExpired && ' (หมดแล้ว)'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{inst.province || '-'}</TableCell>
                    <TableCell>
                      {pm.isOverdue ? (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle size={12} className="mr-1" />เกินกำหนด PM {pm.completedCount + 1}
                        </Badge>
                      ) : pm.nextPM ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock size={12} className="mr-1" />PM {pm.completedCount}/{pm.totalScheduled}
                        </Badge>
                      ) : pm.totalScheduled > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle size={12} className="mr-1" />ครบแล้ว
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddInstallationDialog open={showAddDialog} onOpenChange={setShowAddDialog} onInstalled={handleInstalled} />
    </div>
  );
}

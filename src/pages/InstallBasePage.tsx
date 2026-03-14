import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Cpu, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { mockInstallations, generatePMSchedule, type Installation } from '@/data/installBaseMockData';
import AddInstallationDialog from '@/components/install-base/AddInstallationDialog';

export default function InstallBasePage() {
  const navigate = useNavigate();
  const [installations, setInstallations] = useState<Installation[]>(mockInstallations);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filtered = useMemo(() => {
    return installations.filter(inst => {
      const matchSearch = !search ||
        inst.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        inst.clinic.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || inst.productCategory === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [installations, search, categoryFilter]);

  // Calculate PM status for each installation
  function getPMStatus(inst: Installation) {
    const schedule = generatePMSchedule(inst.installDate);
    const completedCount = inst.pmReports.filter(r => r.status === 'COMPLETED').length;
    const today = new Date().toISOString().split('T')[0];
    const nextPM = schedule.find(s => s.number > completedCount);
    const isOverdue = nextPM && nextPM.date < today;
    return { completedCount, totalScheduled: schedule.length, nextPM, isOverdue };
  }

  // KPI cards
  const totalInstalled = installations.length;
  const categoryBreakdown = installations.reduce((acc, inst) => {
    acc[inst.productCategory] = (acc[inst.productCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const overdueCount = installations.filter(inst => getPMStatus(inst).isOverdue).length;
  const warrantyActive = installations.filter(inst => inst.warrantyExpiry >= new Date().toISOString().split('T')[0]).length;

  const categoryColors: Record<string, string> = {
    'ND2': 'bg-indigo-100 text-indigo-800',
    'Trica 3D': 'bg-violet-100 text-violet-800',
    'Quattro': 'bg-teal-100 text-teal-800',
    'Picohi': 'bg-pink-100 text-pink-800',
    'Freezero': 'bg-cyan-100 text-cyan-800',
  };

  function handleInstalled(inst: Installation) {
    setInstallations(prev => [...prev, inst]);
    // Also push to the shared mock array
    mockInstallations.push(inst);
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

      {/* KPI Cards */}
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
                <Badge key={cat} variant="outline" className={categoryColors[cat] || ''}>{cat}: {count}</Badge>
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกประเภท</SelectItem>
            <SelectItem value="ND2">ND2</SelectItem>
            <SelectItem value="Trica 3D">Trica 3D</SelectItem>
            <SelectItem value="Quattro">Quattro</SelectItem>
            <SelectItem value="Picohi">Picohi</SelectItem>
            <SelectItem value="Freezero">Freezero</SelectItem>
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
                <TableHead>วันติดตั้ง</TableHead>
                <TableHead>ประกันหมด</TableHead>
                <TableHead>จังหวัด</TableHead>
                <TableHead>PM Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inst => {
                const pm = getPMStatus(inst);
                const warrantyExpired = inst.warrantyExpiry < new Date().toISOString().split('T')[0];
                return (
                  <TableRow
                    key={inst.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/install-base/${inst.id}`)}
                  >
                    <TableCell><Badge className={categoryColors[inst.productCategory]} variant="outline">{inst.productCategory}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{inst.serialNumber}</TableCell>
                    <TableCell className="font-medium">{inst.clinic}</TableCell>
                    <TableCell className="text-sm">{inst.installDate}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${warrantyExpired ? 'text-red-600 font-medium' : ''}`}>
                        {inst.warrantyExpiry}
                        {warrantyExpired && ' (หมดแล้ว)'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{inst.province}</TableCell>
                    <TableCell>
                      {pm.isOverdue ? (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle size={12} className="mr-1" />เกินกำหนด PM {pm.completedCount + 1}
                        </Badge>
                      ) : pm.nextPM ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock size={12} className="mr-1" />PM {pm.completedCount}/{pm.totalScheduled}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle size={12} className="mr-1" />ครบแล้ว
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
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

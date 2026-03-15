import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Clock, Users, TrendingUp, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface CheckinRecord {
  id: string;
  user_name: string;
  department: string | null;
  work_type: string;
  check_in_at: string;
  check_out_at: string | null;
  check_in_address: string | null;
  check_out_address: string | null;
  check_in_note: string | null;
}

const workTypeLabels: Record<string, string> = {
  OFFICE: 'เข้าออฟฟิศ',
  FIELD: 'ออกพื้นที่',
  WFH: 'WFH',
};
const workTypeColors: Record<string, string> = {
  OFFICE: 'bg-blue-100 text-blue-800',
  FIELD: 'bg-amber-100 text-amber-800',
  WFH: 'bg-emerald-100 text-emerald-800',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function calcHours(checkIn: string, checkOut: string | null): string {
  if (!checkOut) return '—';
  const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60);
  return `${diff.toFixed(1)} ชม.`;
}

export default function AttendanceSummaryPage() {
  const [records, setRecords] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterUser, setFilterUser] = useState('ALL');

  useEffect(() => {
    fetchRecords();
  }, [viewMode, selectedDate, selectedMonth]);

  async function fetchRecords() {
    setLoading(true);
    let query = supabase.from('work_checkins').select('*').order('check_in_at', { ascending: false });
    if (viewMode === 'daily') {
      query = query.gte('check_in_at', `${selectedDate}T00:00:00`).lte('check_in_at', `${selectedDate}T23:59:59`);
    } else {
      const [y, m] = selectedMonth.split('-');
      const start = `${y}-${m}-01T00:00:00`;
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      const end = `${y}-${m}-${lastDay}T23:59:59`;
      query = query.gte('check_in_at', start).lte('check_in_at', end);
    }
    const { data } = await query;
    setRecords((data as unknown as CheckinRecord[]) || []);
    setLoading(false);
  }

  const users = useMemo(() => {
    const set = new Set(records.map(r => r.user_name));
    return ['ALL', ...Array.from(set).sort()];
  }, [records]);

  const filtered = filterUser === 'ALL' ? records : records.filter(r => r.user_name === filterUser);

  // KPI cards
  const totalDays = new Set(filtered.map(r => new Date(r.check_in_at).toDateString())).size;
  const totalRecords = filtered.length;
  const avgHours = (() => {
    const withCheckout = filtered.filter(r => r.check_out_at);
    if (withCheckout.length === 0) return '—';
    const total = withCheckout.reduce((sum, r) => sum + (new Date(r.check_out_at!).getTime() - new Date(r.check_in_at).getTime()), 0);
    return `${(total / withCheckout.length / (1000 * 60 * 60)).toFixed(1)} ชม.`;
  })();
  const workTypeCounts = filtered.reduce((acc, r) => { acc[r.work_type] = (acc[r.work_type] || 0) + 1; return acc; }, {} as Record<string, number>);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const shiftMonth = (months: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + months, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const downloadCsv = () => {
    const headers = ['ชื่อ', 'แผนก', 'ประเภท', 'วันที่', 'เวลาเข้า', 'เวลาออก', 'ชั่วโมง', 'สถานที่เข้า', 'หมายเหตุ'];
    const rows = filtered.map(r => [
      r.user_name,
      r.department || '',
      workTypeLabels[r.work_type] || r.work_type,
      new Date(r.check_in_at).toLocaleDateString('th-TH'),
      formatTime(r.check_in_at),
      r.check_out_at ? formatTime(r.check_out_at) : '',
      calcHours(r.check_in_at, r.check_out_at),
      r.check_in_address || '',
      r.check_in_note || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${viewMode === 'daily' ? selectedDate : selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">สรุปการเข้างาน</h1>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={v => setViewMode(v as 'daily' | 'monthly')}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">รายวัน</SelectItem>
              <SelectItem value="monthly">รายเดือน</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-1.5">
            <Download size={14} /> CSV
          </Button>
        </div>
      </div>

      {/* Date/Month navigator */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => viewMode === 'daily' ? shiftDate(-1) : shiftMonth(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <span className="text-sm font-medium min-w-[150px] text-center">
          {viewMode === 'daily'
            ? new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : (() => { const [y, m] = selectedMonth.split('-'); return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }); })()
          }
        </span>
        <Button variant="ghost" size="icon" onClick={() => viewMode === 'daily' ? shiftDate(1) : shiftMonth(1)}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Filter by user */}
      <Select value={filterUser} onValueChange={setFilterUser}>
        <SelectTrigger className="w-48"><SelectValue placeholder="กรองตามชื่อ" /></SelectTrigger>
        <SelectContent>
          {users.map(u => <SelectItem key={u} value={u}>{u === 'ALL' ? 'ทั้งหมด' : u}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users size={14} />จำนวนเช็คอิน</div>
          <p className="text-2xl font-bold">{totalRecords}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CalendarDays size={14} />จำนวนวัน</div>
          <p className="text-2xl font-bold">{totalDays}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock size={14} />ชม. เฉลี่ย</div>
          <p className="text-2xl font-bold">{avgHours}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp size={14} />ประเภท</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(workTypeCounts).map(([k, v]) => (
              <Badge key={k} className={workTypeColors[k] || 'bg-muted'} variant="outline">
                {workTypeLabels[k] || k}: {v}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {viewMode === 'monthly' && <TableHead>วันที่</TableHead>}
              <TableHead>ชื่อ</TableHead>
              <TableHead>แผนก</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>เข้า</TableHead>
              <TableHead>ออก</TableHead>
              <TableHead>ชั่วโมง</TableHead>
              <TableHead>หมายเหตุ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={viewMode === 'monthly' ? 8 : 7} className="text-center py-8 text-muted-foreground">กำลังโหลด...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={viewMode === 'monthly' ? 8 : 7} className="text-center py-8 text-muted-foreground">ไม่มีข้อมูล</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                {viewMode === 'monthly' && <TableCell className="text-xs">{new Date(r.check_in_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</TableCell>}
                <TableCell className="text-sm font-medium">{r.user_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.department || '—'}</TableCell>
                <TableCell><Badge className={workTypeColors[r.work_type] || 'bg-muted'} variant="outline">{workTypeLabels[r.work_type] || r.work_type}</Badge></TableCell>
                <TableCell className="text-sm font-mono">{formatTime(r.check_in_at)}</TableCell>
                <TableCell className="text-sm font-mono">{r.check_out_at ? formatTime(r.check_out_at) : '—'}</TableCell>
                <TableCell className="text-sm">{calcHours(r.check_in_at, r.check_out_at)}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.check_in_note || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

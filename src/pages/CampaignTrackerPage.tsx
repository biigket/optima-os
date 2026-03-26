import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, Phone, ExternalLink, MapPin, Filter, CheckCircle2, Clock, XCircle, MessageCircle, AlertTriangle, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CampaignTargetCard from '@/components/campaign/CampaignTargetCard';
import CampaignKpiBar from '@/components/campaign/CampaignKpiBar';

const STATUS_OPTIONS = [
  { value: 'ยังไม่ติดต่อ', label: 'ยังไม่ติดต่อ', color: 'bg-muted text-muted-foreground' },
  { value: 'ติดต่อแล้ว', label: 'ติดต่อแล้ว', color: 'bg-blue-100 text-blue-800' },
  { value: 'นัดเยี่ยมแล้ว', label: 'นัดเยี่ยมแล้ว', color: 'bg-amber-100 text-amber-800' },
  { value: 'เยี่ยมแล้ว', label: 'เยี่ยมแล้ว', color: 'bg-green-100 text-green-800' },
  { value: 'สนใจ', label: 'สนใจ', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'ไม่สนใจ', label: 'ไม่สนใจ', color: 'bg-red-100 text-red-800' },
  { value: 'ปิดดีลแล้ว', label: 'ปิดดีลแล้ว', color: 'bg-purple-100 text-purple-800' },
];

export const NEXT_STEP_PLACEHOLDERS: Record<string, string> = {
  'ยังไม่ติดต่อ': 'โทรครั้งแรก/ทัก LINE แนะนำโปรแกรม Switch to Doublo',
  'ติดต่อแล้ว': 'โทรขอคุยกับหมอ/เจ้าของ และขอนัดเยี่ยม/ประเมินเครื่อง',
  'นัดเยี่ยมแล้ว': 'เข้าเยี่ยม/ประเมินเครื่องตามวันนัด',
  'เยี่ยมแล้ว': 'สรุปผลประเมิน + เสนอ Switch Value / เตรียม proposal',
  'สนใจ': 'ส่ง proposal + โทรตามผล / คุยเงื่อนไขปิดดีล',
  'ไม่สนใจ': 'บันทึกเหตุผล + กำหนดวันทักอีกครั้ง (เช่น 6 เดือน)',
  'ปิดดีลแล้ว': 'ประสานทีมติดตั้ง + นัด Training / ทำสื่อการตลาดให้คลินิก',
};

const ZONES = ['ALL', 'BKK1', 'BKK2', 'BKK3', 'BKK4', 'BKK5'];
const ZONE_SALES: Record<string, string> = { BKK1: 'Ford', BKK2: 'Fah', BKK3: 'Chananpas', BKK4: 'Varn', BKK5: 'Vi' };

export { STATUS_OPTIONS };

export default function CampaignTrackerPage() {
  const { currentUser } = useMockAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isManager = currentUser?.position === 'OWNER' || currentUser?.position === 'SALES_MANAGER' || currentUser?.role === 'ADMIN';

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['campaign-targets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_targets')
        .select('*')
        .order('zone')
        .order('clinic_name');
      if (error) throw error;
      return data as any[];
    },
  });

  const roleFiltered = useMemo(() => {
    if (isManager) return targets;
    return targets.filter(t => t.assigned_sale === currentUser?.name);
  }, [targets, isManager, currentUser?.name]);

  const filtered = useMemo(() => {
    let result = roleFiltered;
    if (zoneFilter !== 'ALL') result = result.filter(t => t.zone === zoneFilter);
    if (statusFilter !== 'ALL') result = result.filter(t => t.contact_status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(t =>
        t.clinic_name?.toLowerCase().includes(q) ||
        t.province?.toLowerCase().includes(q) ||
        t.phone?.includes(q)
      );
    }
    return result;
  }, [roleFiltered, zoneFilter, statusFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = roleFiltered.length;
    const contacted = roleFiltered.filter(t => t.contact_status !== 'ยังไม่ติดต่อ').length;
    const visited = roleFiltered.filter(t => ['เยี่ยมแล้ว', 'สนใจ', 'ปิดดีลแล้ว'].includes(t.contact_status)).length;
    const interested = roleFiltered.filter(t => t.contact_status === 'สนใจ').length;
    const closed = roleFiltered.filter(t => t.contact_status === 'ปิดดีลแล้ว').length;
    const notInterested = roleFiltered.filter(t => t.contact_status === 'ไม่สนใจ').length;
    return { total, contacted, visited, interested, closed, notInterested, progress: total ? Math.round((contacted / total) * 100) : 0 };
  }, [roleFiltered]);

  // Zone stats for manager view
  const zoneStats = useMemo(() => {
    if (!isManager) return [];
    return Object.entries(ZONE_SALES).map(([zone, sale]) => {
      const zoneTargets = targets.filter(t => t.zone === zone);
      const total = zoneTargets.length;
      const contacted = zoneTargets.filter(t => t.contact_status !== 'ยังไม่ติดต่อ').length;
      return { zone, sale, total, contacted, progress: total ? Math.round((contacted / total) * 100) : 0 };
    });
  }, [targets, isManager]);

  // Today's tasks: next_step_date is today or overdue
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = useMemo(() => {
    return roleFiltered
      .filter(t => t.next_step_date && t.next_step_date <= todayStr && t.contact_status !== 'ปิดดีลแล้ว')
      .sort((a, b) => (a.next_step_date || '').localeCompare(b.next_step_date || ''));
  }, [roleFiltered, todayStr]);

  const handleSave = async (id: string, data: { contact_status: string; next_step: string; next_step_date: string }) => {
    const updateData: any = {
      contact_status: data.contact_status,
      next_step: data.next_step || null,
      next_step_date: data.next_step_date || null,
    };
    if (data.contact_status === 'เยี่ยมแล้ว' || data.contact_status === 'สนใจ' || data.contact_status === 'ปิดดีลแล้ว') {
      updateData.visited_at = new Date().toISOString();
    }
    const { error } = await supabase.from('campaign_targets').update(updateData).eq('id', id);
    if (error) { toast.error(error.message); return; }
    queryClient.invalidateQueries({ queryKey: ['campaign-targets'] });
    toast.success('อัพเดทสถานะแล้ว');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">🎯 Campaign Tracker</h1>
        <p className="text-sm text-muted-foreground">Trade-In UF3 → Doublo | 🔴 1st Priority</p>
      </div>

      <CampaignKpiBar stats={stats} />

      {/* Overall Progress */}
      <Card><CardContent className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">ความคืบหน้ารวม</span>
          <span className="text-sm font-bold">{stats.progress}%</span>
        </div>
        <Progress value={stats.progress} className="h-2.5" />
      </CardContent></Card>

      {/* Zone Progress (manager only) */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {zoneStats.map(z => (
            <Card key={z.zone} className="cursor-pointer hover:ring-2 ring-primary/30 transition-all"
              onClick={() => setZoneFilter(zoneFilter === z.zone ? 'ALL' : z.zone)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold">{z.zone}</span>
                  <Badge variant="outline" className="text-xs">{z.sale}</Badge>
                </div>
                <Progress value={z.progress} className="h-2 mb-1" />
                <div className="text-xs text-muted-foreground">{z.contacted}/{z.total} ({z.progress}%)</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck size={16} className="text-amber-600" />
              <span className="text-sm font-bold text-amber-800">งานวันนี้ ({todayTasks.length})</span>
            </div>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {todayTasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-xs bg-white rounded px-2 py-1.5 border border-amber-200">
                  {t.next_step_date < todayStr && (
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  )}
                  <span className="font-medium truncate min-w-0">{t.clinic_name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{t.contact_status}</Badge>
                  <span className="text-muted-foreground truncate min-w-0 flex-1">{t.next_step}</span>
                  <span className="text-muted-foreground shrink-0">{t.next_step_date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="ค้นหาคลินิก..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isManager && (
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[130px]"><Filter size={14} className="mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              {ZONES.map(z => <SelectItem key={z} value={z}>{z === 'ALL' ? 'ทุกเขต' : `${z} (${ZONE_SALES[z]})`}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <div className="text-sm text-muted-foreground">แสดง {filtered.length} จาก {roleFiltered.length} รายการ</div>

      {/* Target List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(target => (
            <CampaignTargetCard
              key={target.id}
              target={target}
              isManager={isManager}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

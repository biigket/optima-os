import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, Phone, ExternalLink, MapPin, Filter, CheckCircle2, Clock, XCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'ยังไม่ติดต่อ', label: 'ยังไม่ติดต่อ', color: 'bg-muted text-muted-foreground' },
  { value: 'ติดต่อแล้ว', label: 'ติดต่อแล้ว', color: 'bg-blue-100 text-blue-800' },
  { value: 'นัดเยี่ยมแล้ว', label: 'นัดเยี่ยมแล้ว', color: 'bg-amber-100 text-amber-800' },
  { value: 'เยี่ยมแล้ว', label: 'เยี่ยมแล้ว', color: 'bg-green-100 text-green-800' },
  { value: 'สนใจ', label: 'สนใจ', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'ไม่สนใจ', label: 'ไม่สนใจ', color: 'bg-red-100 text-red-800' },
];

const ZONES = ['ALL', 'BKK1', 'BKK2', 'BKK3', 'BKK4', 'BKK5'];
const ZONE_SALES: Record<string, string> = { BKK1: 'Ford', BKK2: 'Fah', BKK3: 'Chananpas', BKK4: 'Varn', BKK5: 'Vi' };

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

  // Filter targets based on role
  const roleFiltered = useMemo(() => {
    if (isManager) return targets;
    // Sales see only their zone
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
    const visited = roleFiltered.filter(t => t.contact_status === 'เยี่ยมแล้ว' || t.contact_status === 'สนใจ').length;
    const interested = roleFiltered.filter(t => t.contact_status === 'สนใจ').length;
    const notInterested = roleFiltered.filter(t => t.contact_status === 'ไม่สนใจ').length;
    return { total, contacted, visited, interested, notInterested, progress: total ? Math.round((contacted / total) * 100) : 0 };
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updateData: any = { contact_status: newStatus };
    if (newStatus === 'เยี่ยมแล้ว' || newStatus === 'สนใจ') {
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

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">เป้าหมายทั้งหมด</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          <div className="text-xs text-muted-foreground">ติดต่อแล้ว</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.visited}</div>
          <div className="text-xs text-muted-foreground">เยี่ยมแล้ว</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.interested}</div>
          <div className="text-xs text-muted-foreground">สนใจ</div>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.notInterested}</div>
          <div className="text-xs text-muted-foreground">ไม่สนใจ</div>
        </CardContent></Card>
      </div>

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
            <Card key={target.id} className={cn(
              "transition-all",
              target.contact_status === 'เยี่ยมแล้ว' && 'border-green-200 bg-green-50/30',
              target.contact_status === 'สนใจ' && 'border-emerald-200 bg-emerald-50/30',
              target.contact_status === 'ไม่สนใจ' && 'opacity-60',
            )}>
              <CardContent className="p-3">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  {/* Clinic info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{target.clinic_name}</span>
                      {isManager && <Badge variant="outline" className="text-[10px] shrink-0">{target.zone} · {target.assigned_sale}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {target.province && <span className="flex items-center gap-0.5"><MapPin size={11} />{target.province}</span>}
                      {target.phone && target.phone !== '-' && (
                        <a href={`tel:${target.phone}`} className="flex items-center gap-0.5 text-blue-600 hover:underline">
                          <Phone size={11} />{target.phone}
                        </a>
                      )}
                      {target.facebook && target.facebook !== '-' && (
                        <a href={target.facebook} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-blue-600 hover:underline">
                          <ExternalLink size={11} />FB
                        </a>
                      )}
                      {target.line_id && target.line_id !== '-' && (
                        <span className="flex items-center gap-0.5"><MessageCircle size={11} />{target.line_id}</span>
                      )}
                    </div>
                    {target.products_used && (
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">🔧 {target.products_used}</div>
                    )}
                    {target.device_type && (
                      <div className="text-[11px] mt-0.5 truncate">{target.device_type}</div>
                    )}
                  </div>

                  {/* Status selector */}
                  <div className="shrink-0">
                    <Select value={target.contact_status} onValueChange={(v) => handleStatusChange(target.id, v)}>
                      <SelectTrigger className={cn("w-[140px] h-8 text-xs",
                        STATUS_OPTIONS.find(s => s.value === target.contact_status)?.color
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.value === 'ยังไม่ติดต่อ' && <Clock className="inline mr-1" size={12} />}
                            {s.value === 'เยี่ยมแล้ว' && <CheckCircle2 className="inline mr-1" size={12} />}
                            {s.value === 'ไม่สนใจ' && <XCircle className="inline mr-1" size={12} />}
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

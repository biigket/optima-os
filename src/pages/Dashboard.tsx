import {
  Users, Target, Presentation, Wrench, DollarSign, FileText,
  CalendarCheck, TrendingUp, Package, Clock, AlertTriangle,
  CheckCircle2, Banknote, ClipboardList, MapPin, Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import KpiCard from '@/components/dashboard/KpiCard';
import PipelineChart from '@/components/dashboard/PipelineChart';
import AnnouncementBoard from '@/components/dashboard/AnnouncementBoard';
import { useDashboardData } from '@/hooks/useDashboardData';

const activityTypeLabels: Record<string, string> = {
  CALL: '📞 โทร',
  MEETING: '🤝 ประชุม',
  TASK: '📋 งาน',
  DEADLINE: '⏰ เดดไลน์',
  DEMO: '🎯 เดโม',
};

const fmt = (n: number) => `฿${(n / 1000000).toFixed(1)}M`;

export default function Dashboard() {
  const { kpis, pipelineStages, upcomingActivities, upcomingDemos, announcements, loading, refetch } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
          <p className="text-sm text-muted-foreground">Optima Aesthetic OS — ภาพรวม</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">Optima Aesthetic OS — ภาพรวมบริษัท</p>
      </div>

      {/* Announcement Board */}
      <AnnouncementBoard announcements={announcements} onRefresh={refetch} />

      {/* Row 1: Sales KPIs */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ฝ่ายขาย</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <KpiCard label="ลีดใหม่" value={kpis.newLeads} icon={Users} variant="accent" />
          <KpiCard label="โอกาสขายเปิดอยู่" value={kpis.activeOpps} icon={Target} variant="default" />
          <KpiCard label="มูลค่า Pipeline" value={fmt(kpis.pipelineValue)} icon={DollarSign} variant="accent" />
          <KpiCard label="ปิดการขายเดือนนี้" value={kpis.wonThisMonth} icon={Trophy} variant="success" />
          <KpiCard label="ยอดขายเดือนนี้" value={fmt(kpis.wonValue)} icon={TrendingUp} variant="success" />
        </div>
      </div>

      {/* Row 2: Operations KPIs */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">ปฏิบัติการ</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <KpiCard label="เดโมรอยืนยัน" value={kpis.pendingDemos} icon={Presentation} variant="warning" />
          <KpiCard label="เดโมยืนยันแล้ว" value={kpis.confirmedDemos} icon={CalendarCheck} variant="success" />
          <KpiCard label="ใบเสนอราคารออนุมัติ" value={kpis.pendingQuotations} icon={FileText} variant="warning" />
          <KpiCard label="ใบเสนอราคาอนุมัติแล้ว" value={kpis.approvedQuotations} icon={CheckCircle2} variant="success" />
        </div>
      </div>

      {/* Row 3: Service + Finance KPIs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">บริการ</h2>
          <div className="grid gap-3 grid-cols-2">
            <KpiCard label="เครื่องติดตั้ง" value={kpis.totalInstalled} icon={Package} variant="default" />
            <KpiCard label="PM เกินกำหนด" value={kpis.overduePM} icon={Wrench} variant={kpis.overduePM > 0 ? 'destructive' : 'default'} />
            <KpiCard label="สัญญาซื้อขาย" value={kpis.activeContracts} icon={ClipboardList} variant="default" />
            <KpiCard label="แผนเยี่ยม" value={kpis.plannedVisits} icon={MapPin} variant="accent" />
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">การเงิน</h2>
          <div className="grid gap-3 grid-cols-2">
            <KpiCard label="ยอดค้างชำระ" value={`฿${kpis.totalDue.toLocaleString()}`} icon={Banknote} variant={kpis.totalDue > 0 ? 'destructive' : 'default'} />
            <KpiCard label="ชำระแล้ว" value={`฿${kpis.totalPaid.toLocaleString()}`} icon={CheckCircle2} variant="success" />
            <KpiCard label="สลิปรอตรวจ" value={kpis.pendingSlips} icon={Clock} variant="warning" />
            <KpiCard label="เกินกำหนดชำระ" value={kpis.overduePayments} icon={AlertTriangle} variant={kpis.overduePayments > 0 ? 'destructive' : 'default'} />
          </div>
        </div>
      </div>

      {/* Row 4: Pipeline Chart */}
      <PipelineChart data={pipelineStages} />

      {/* Row 5: Activities + Demos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">กิจกรรมที่กำลังจะมาถึง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingActivities.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีกิจกรรมที่รอดำเนินการ</p>
            )}
            {upcomingActivities.map(act => (
              <div key={act.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activityTypeLabels[act.activity_type] || act.activity_type}
                    {act.clinic_name && ` · ${act.clinic_name}`}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {new Date(act.activity_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  {act.start_time && ` ${act.start_time}`}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">เดโมที่กำลังจะมาถึง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingDemos.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีเดโมที่กำลังจะมาถึง</p>
            )}
            {upcomingDemos.map(demo => (
              <div key={demo.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{demo.clinic_name || 'ไม่ระบุคลินิก'}</p>
                  <p className="text-xs text-muted-foreground">
                    {demo.products_demo?.join(', ') || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(demo.demo_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                  <StatusBadge status={demo.confirmed ? 'CONFIRMED' : 'PENDING'} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

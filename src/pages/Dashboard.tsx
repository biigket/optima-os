import {
  Target, Users, Presentation, Wrench, Package, AlertTriangle, DollarSign
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockOpportunities, mockWorkItems, mockInventory, mockActivityLogs, getAccountById, getUserById } from '@/data/mockData';

export default function Dashboard() {
  const newLeads = mockOpportunities.filter(o => o.stage === 'NEW_LEAD').length;
  const activeOpps = mockOpportunities.filter(o => !['WON', 'LOST'].includes(o.stage)).length;
  const upcomingDemos = mockWorkItems.filter(w => w.type === 'DEMO_EVENT' && w.status !== 'DONE').length;
  const openTickets = mockWorkItems.filter(w => w.type === 'SERVICE_TICKET' && w.status !== 'DONE').length;
  const lowStock = mockInventory.filter(i => i.status === 'OUT' || i.quantity <= 2).length;
  const totalPipeline = mockOpportunities.filter(o => !['WON', 'LOST'].includes(o.stage)).reduce((s, o) => s + (o.expected_value || 0), 0);

  const recentActivities = [...mockActivityLogs].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">Optima Aesthetic OS — ภาพรวม</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ลีดใหม่" value={newLeads} icon={Users} variant="accent" />
        <KpiCard label="โอกาสขายที่เปิดอยู่" value={activeOpps} icon={Target} variant="default" />
        <KpiCard label="ขอคิวเดโม" value={upcomingDemos} icon={Presentation} variant="warning" />
        <KpiCard label="ใบแจ้งซ่อมเปิดอยู่" value={openTickets} icon={Wrench} variant="destructive" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="สินค้าใกล้หมด" value={lowStock} icon={AlertTriangle} variant="warning" />
        <KpiCard label="มูลค่า Pipeline" value={`฿${(totalPipeline / 1000000).toFixed(1)}M`} icon={DollarSign} variant="accent" />
        <KpiCard label="วัสดุสิ้นเปลือง" value={mockInventory.filter(i => i.category === 'CONSUMABLE').length} icon={Package} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">กิจกรรมล่าสุด</h3>
          <div className="space-y-3">
            {recentActivities.map(activity => {
              const account = getAccountById(activity.linkedAccountId);
              const user = getUserById(activity.performedByUserId);
              return (
                <div key={activity.activityId} className="flex gap-3 text-sm">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {user?.name} · {account?.clinic_name} · {new Date(activity.performedAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">งานที่เปิดอยู่</h3>
          <div className="space-y-2">
            {mockWorkItems.filter(w => w.status !== 'DONE' && w.status !== 'CANCELLED').slice(0, 6).map(item => {
              const account = getAccountById(item.linkedAccountId);
              return (
                <div key={item.workItemId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{account?.clinic_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

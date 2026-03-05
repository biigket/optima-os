import {
  BarChart3, Users, Target, TrendingUp, Wrench, Package, DollarSign
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAccounts, mockOpportunities, mockWorkItems, mockInventory, mockActivityLogs } from '@/data/mockData';

export default function AnalyticsPage() {
  const totalAccounts = mockAccounts.length;
  const customers = mockAccounts.filter(a => a.customerStatus === 'CUSTOMER').length;
  const prospects = mockAccounts.filter(a => a.customerStatus === 'PROSPECT').length;
  const wonDeals = mockOpportunities.filter(o => o.stage === 'WON');
  const wonValue = wonDeals.reduce((s, o) => s + o.expectedValue, 0);
  const conversionRate = mockOpportunities.length > 0 ? ((wonDeals.length / mockOpportunities.length) * 100).toFixed(0) : '0';

  const deptWorkload = ['SALES', 'PRODUCT', 'SERVICE', 'STOCK', 'FINANCE'].map(dept => ({
    dept,
    total: mockWorkItems.filter(w => w.departmentOwner === dept).length,
    open: mockWorkItems.filter(w => w.departmentOwner === dept && w.status !== 'DONE' && w.status !== 'CANCELLED').length,
  }));

  const byType = ['NEW_DEVICE', 'CONSUMABLE_REPEAT', 'UPSELL', 'SERVICE_CONTRACT'].map(t => ({
    type: t,
    count: mockOpportunities.filter(o => o.opportunityType === t).length,
    value: mockOpportunities.filter(o => o.opportunityType === t).reduce((s, o) => s + o.expectedValue, 0),
  }));

  const typeLabels: Record<string, string> = {
    NEW_DEVICE: 'เครื่องใหม่', CONSUMABLE_REPEAT: 'สั่งวัสดุซ้ำ', UPSELL: 'อัพเซลล์', SERVICE_CONTRACT: 'สัญญาบริการ'
  };
  const deptLabels: Record<string, string> = {
    SALES: 'ฝ่ายขาย', PRODUCT: 'ผลิตภัณฑ์', SERVICE: 'บริการ', STOCK: 'คลัง', FINANCE: 'การเงิน'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">วิเคราะห์</h1>
        <p className="text-sm text-muted-foreground">รายงานและข้อมูลเชิงลึก</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ลูกค้าทั้งหมด" value={totalAccounts} icon={Users} />
        <KpiCard label="ลูกค้าปัจจุบัน" value={customers} icon={Users} variant="accent" />
        <KpiCard label="ยอดขายปิดได้" value={`฿${(wonValue / 1e3).toFixed(0)}K`} icon={DollarSign} variant="accent" />
        <KpiCard label="อัตราปิดการขาย" value={`${conversionRate}%`} icon={TrendingUp} variant="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Opportunity by Type */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">โอกาสขายตามประเภท</h3>
          <div className="space-y-3">
            {byType.map(t => {
              const maxVal = Math.max(...byType.map(d => d.value), 1);
              const pct = (t.value / maxVal) * 100;
              return (
                <div key={t.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{typeLabels[t.type]}</span>
                    <span className="text-muted-foreground">{t.count} รายการ · ฿{(t.value / 1e6).toFixed(2)}M</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${Math.max(pct, 3)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workload by Dept */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">ภาระงานตามแผนก</h3>
          <div className="space-y-3">
            {deptWorkload.map(d => (
              <div key={d.dept} className="flex items-center justify-between rounded-md border px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.dept} />
                  <span className="text-sm font-medium text-foreground">{deptLabels[d.dept]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">ทั้งหมด {d.total}</span>
                  <span className="font-semibold text-foreground">เปิดอยู่ {d.open}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">สถานะลูกค้า</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'ลูกค้าปัจจุบัน', value: customers, color: 'bg-green-500' },
            { label: 'ผู้มุ่งหวัง', value: prospects, color: 'bg-accent' },
            { label: 'ไม่เคลื่อนไหว', value: mockAccounts.filter(a => a.customerStatus === 'DORMANT').length, color: 'bg-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-md border p-4 flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

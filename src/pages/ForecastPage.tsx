import {
  TrendingUp, Target, DollarSign, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import { mockOpportunities, getAccountById } from '@/data/mockData';

export default function ForecastPage() {
  const activeOpps = mockOpportunities.filter(o => !['WON', 'LOST'].includes(o.stage));
  const totalPipeline = activeOpps.reduce((s, o) => s + o.expectedValue, 0);
  const weightedPipeline = activeOpps.reduce((s, o) => {
    const weights: Record<string, number> = { NEW: 0.1, CONTACTED: 0.2, DEMO_SCHEDULED: 0.4, DEMO_DONE: 0.6, NEGOTIATION: 0.8 };
    return s + o.expectedValue * (weights[o.stage] || 0.1);
  }, 0);

  const byMonth: Record<string, number> = {};
  activeOpps.forEach(o => {
    const m = new Date(o.closeDate).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
    byMonth[m] = (byMonth[m] || 0) + o.expectedValue;
  });

  const stageData = [
    { stage: 'ใหม่', count: activeOpps.filter(o => o.stage === 'NEW').length, value: activeOpps.filter(o => o.stage === 'NEW').reduce((s, o) => s + o.expectedValue, 0) },
    { stage: 'ติดต่อแล้ว', count: activeOpps.filter(o => o.stage === 'CONTACTED').length, value: activeOpps.filter(o => o.stage === 'CONTACTED').reduce((s, o) => s + o.expectedValue, 0) },
    { stage: 'นัดสาธิต', count: activeOpps.filter(o => o.stage === 'DEMO_SCHEDULED').length, value: activeOpps.filter(o => o.stage === 'DEMO_SCHEDULED').reduce((s, o) => s + o.expectedValue, 0) },
    { stage: 'สาธิตแล้ว', count: activeOpps.filter(o => o.stage === 'DEMO_DONE').length, value: activeOpps.filter(o => o.stage === 'DEMO_DONE').reduce((s, o) => s + o.expectedValue, 0) },
    { stage: 'เจรจา', count: activeOpps.filter(o => o.stage === 'NEGOTIATION').length, value: activeOpps.filter(o => o.stage === 'NEGOTIATION').reduce((s, o) => s + o.expectedValue, 0) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">พยากรณ์</h1>
        <p className="text-sm text-muted-foreground">คาดการณ์ยอดขายจาก Pipeline ปัจจุบัน</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="มูลค่า Pipeline" value={`฿${(totalPipeline / 1e6).toFixed(1)}M`} icon={DollarSign} variant="accent" />
        <KpiCard label="มูลค่าถ่วงน้ำหนัก" value={`฿${(weightedPipeline / 1e6).toFixed(2)}M`} icon={TrendingUp} variant="default" />
        <KpiCard label="โอกาสที่เปิดอยู่" value={activeOpps.length} icon={Target} variant="warning" />
      </div>

      {/* Funnel */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sales Funnel</h3>
        <div className="space-y-3">
          {stageData.map((s, i) => {
            const maxVal = Math.max(...stageData.map(d => d.value), 1);
            const pct = (s.value / maxVal) * 100;
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="w-20 text-xs font-medium text-muted-foreground text-right">{s.stage}</span>
                <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full bg-accent/80 rounded-md flex items-center px-3 transition-all"
                    style={{ width: `${Math.max(pct, 5)}%` }}
                  >
                    <span className="text-xs font-semibold text-accent-foreground whitespace-nowrap">
                      {s.count} · ฿{(s.value / 1e6).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By month */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">คาดการณ์ตามเดือนปิด</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byMonth).map(([month, value]) => (
            <div key={month} className="rounded-md border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{month}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">฿{(value / 1e6).toFixed(2)}M</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top deals */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">ดีลมูลค่าสูงสุด</h3>
        <div className="space-y-2">
          {[...activeOpps].sort((a, b) => b.expectedValue - a.expectedValue).slice(0, 5).map((opp, i) => {
            const account = getAccountById(opp.accountId);
            return (
              <div key={opp.opportunityId} className="flex items-center justify-between rounded-md border px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{account?.clinicName}</p>
                    <p className="text-xs text-muted-foreground">{opp.stage}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">฿{opp.expectedValue.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

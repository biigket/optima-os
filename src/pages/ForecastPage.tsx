import { useState, useEffect } from 'react';
import {
  TrendingUp, Target, DollarSign, Calendar
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import { supabase } from '@/integrations/supabase/client';

interface OppRow {
  id: string;
  account_id: string;
  stage: string;
  expected_value: number | null;
  close_date: string | null;
}

export default function ForecastPage() {
  const [activeOpps, setActiveOpps] = useState<OppRow[]>([]);
  const [accountMap, setAccountMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: opps } = await supabase.from('opportunities').select('id, account_id, stage, expected_value, close_date');
      const active = (opps || []).filter(o => !['WON', 'LOST'].includes(o.stage));
      setActiveOpps(active);

      const ids = [...new Set(active.map(o => o.account_id))];
      if (ids.length > 0) {
        const { data: accounts } = await supabase.from('accounts').select('id, clinic_name').in('id', ids);
        const map: Record<string, string> = {};
        (accounts || []).forEach(a => { map[a.id] = a.clinic_name; });
        setAccountMap(map);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;

  const totalPipeline = activeOpps.reduce((s, o) => s + (o.expected_value || 0), 0);
  const weightedPipeline = activeOpps.reduce((s, o) => {
    const weights: Record<string, number> = { NEW_LEAD: 0.1, CONTACTED: 0.2, DEMO_SCHEDULED: 0.4, DEMO_DONE: 0.6, NEGOTIATION: 0.8 };
    return s + (o.expected_value || 0) * (weights[o.stage] || 0.1);
  }, 0);

  const byMonth: Record<string, number> = {};
  activeOpps.forEach(o => {
    if (!o.close_date) return;
    const m = new Date(o.close_date).toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
    byMonth[m] = (byMonth[m] || 0) + (o.expected_value || 0);
  });

  const stageData = [
    { stage: 'ใหม่', key: 'NEW_LEAD' },
    { stage: 'ติดต่อแล้ว', key: 'CONTACTED' },
    { stage: 'นัดสาธิต', key: 'DEMO_SCHEDULED' },
    { stage: 'สาธิตแล้ว', key: 'DEMO_DONE' },
    { stage: 'เจรจา', key: 'NEGOTIATION' },
  ].map(s => ({
    stage: s.stage,
    count: activeOpps.filter(o => o.stage === s.key).length,
    value: activeOpps.filter(o => o.stage === s.key).reduce((sum, o) => sum + (o.expected_value || 0), 0),
  }));

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

      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sales Funnel</h3>
        <div className="space-y-3">
          {stageData.map((s) => {
            const maxVal = Math.max(...stageData.map(d => d.value), 1);
            const pct = (s.value / maxVal) * 100;
            return (
              <div key={s.stage} className="flex items-center gap-4">
                <span className="w-20 text-xs font-medium text-muted-foreground text-right">{s.stage}</span>
                <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                  <div className="h-full bg-accent/80 rounded-md flex items-center px-3 transition-all" style={{ width: `${Math.max(pct, 5)}%` }}>
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

      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">ดีลมูลค่าสูงสุด</h3>
        <div className="space-y-2">
          {[...activeOpps].sort((a, b) => (b.expected_value || 0) - (a.expected_value || 0)).slice(0, 5).map((opp, i) => (
            <div key={opp.id} className="flex items-center justify-between rounded-md border px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{accountMap[opp.account_id] || '-'}</p>
                  <p className="text-xs text-muted-foreground">{opp.stage}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">฿{(opp.expected_value || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

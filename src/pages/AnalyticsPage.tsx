import { useState, useEffect } from 'react';
import {
  Users, Target, TrendingUp, DollarSign
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import { supabase } from '@/integrations/supabase/client';

export default function AnalyticsPage() {
  const [data, setData] = useState({
    totalAccounts: 0, customers: 0, prospects: 0, dormant: 0,
    wonValue: 0, conversionRate: '0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [accRes, oppRes] = await Promise.all([
        supabase.from('accounts').select('id, customer_status'),
        supabase.from('opportunities').select('id, stage, expected_value'),
      ]);
      const accounts = accRes.data || [];
      const opps = oppRes.data || [];
      const wonDeals = opps.filter(o => o.stage === 'WON');
      const wonValue = wonDeals.reduce((s, o) => s + (o.expected_value || 0), 0);
      const rate = opps.length > 0 ? ((wonDeals.length / opps.length) * 100).toFixed(0) : '0';

      setData({
        totalAccounts: accounts.length,
        customers: accounts.filter(a => a.customer_status === 'PURCHASED').length,
        prospects: accounts.filter(a => a.customer_status === 'NEW_LEAD').length,
        dormant: accounts.filter(a => a.customer_status === 'DORMANT').length,
        wonValue,
        conversionRate: rate,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">วิเคราะห์</h1>
        <p className="text-sm text-muted-foreground">รายงานและข้อมูลเชิงลึก</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="ลูกค้าทั้งหมด" value={data.totalAccounts} icon={Users} />
        <KpiCard label="ลูกค้าปัจจุบัน" value={data.customers} icon={Users} variant="accent" />
        <KpiCard label="ยอดขายปิดได้" value={`฿${(data.wonValue / 1e3).toFixed(0)}K`} icon={DollarSign} variant="accent" />
        <KpiCard label="อัตราปิดการขาย" value={`${data.conversionRate}%`} icon={TrendingUp} variant="default" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">สถานะลูกค้า</h3>
          <div className="space-y-4">
            {[
              { label: 'ลูกค้าปัจจุบัน', value: data.customers, color: 'bg-green-500' },
              { label: 'ผู้มุ่งหวัง', value: data.prospects, color: 'bg-accent' },
              { label: 'ไม่เคลื่อนไหว', value: data.dormant, color: 'bg-muted-foreground' },
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

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">ภาพรวมโอกาสขาย</h3>
          <div className="space-y-4">
            <div className="rounded-md border p-4 flex items-center gap-4">
              <Target size={20} className="text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">{data.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">อัตราปิดการขาย</p>
              </div>
            </div>
            <div className="rounded-md border p-4 flex items-center gap-4">
              <DollarSign size={20} className="text-accent" />
              <div>
                <p className="text-2xl font-bold text-foreground">฿{(data.wonValue / 1e6).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground">มูลค่าปิดการขายรวม</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

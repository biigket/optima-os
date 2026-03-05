import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockOpportunities, getAccountById, getUserById } from '@/data/mockData';
import type { OpportunityStage } from '@/types';

const stages: (OpportunityStage | 'ALL')[] = ['ALL', 'NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const stageLabels: Record<string, string> = {
  ALL: 'ทั้งหมด', NEW: 'ใหม่', CONTACTED: 'ติดต่อแล้ว', DEMO_SCHEDULED: 'นัดสาธิต',
  DEMO_DONE: 'สาธิตแล้ว', NEGOTIATION: 'เจรจา', WON: 'ปิดได้', LOST: 'ปิดไม่ได้'
};
const typeLabels: Record<string, string> = {
  NEW_DEVICE: 'เครื่องใหม่', CONSUMABLE_REPEAT: 'สั่งวัสดุซ้ำ', UPSELL: 'อัพเซลล์', SERVICE_CONTRACT: 'สัญญาบริการ'
};

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');

  const filtered = mockOpportunities.filter(o => {
    const account = getAccountById(o.accountId);
    const matchSearch = account?.clinicName.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || o.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const totalValue = filtered.reduce((sum, o) => sum + o.expectedValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">โอกาสขาย</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} รายการ · มูลค่ารวม ฿{totalValue.toLocaleString()}</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> เพิ่มโอกาสขาย</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาโอกาสขาย..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {stages.map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${stageFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {stageLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">สถานะ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">เจ้าของ</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">มูลค่า (฿)</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">วันปิด</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(opp => {
              const account = getAccountById(opp.accountId);
              const owner = getUserById(opp.ownerUserId);
              return (
                <tr key={opp.opportunityId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{account?.clinicName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{typeLabels[opp.opportunityType]}</td>
                  <td className="px-4 py-3"><StatusBadge status={opp.stage} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{owner?.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">฿{opp.expectedValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(opp.closeDate).toLocaleDateString('th-TH')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

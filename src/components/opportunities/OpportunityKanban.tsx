import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/ui/StatusBadge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Building2 } from 'lucide-react';
import { getAccountById } from '@/data/mockData';
import type { Opportunity, OpportunityStage } from '@/types';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'ใหม่', CONTACTED: 'ติดต่อแล้ว', DEMO_SCHEDULED: 'นัดสาธิต',
  DEMO_DONE: 'สาธิตแล้ว', NEGOTIATION: 'เจรจา', WON: 'ปิดได้', LOST: 'ปิดไม่ได้',
};
const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'border-t-blue-400', CONTACTED: 'border-t-cyan-400', DEMO_SCHEDULED: 'border-t-amber-400',
  DEMO_DONE: 'border-t-orange-400', NEGOTIATION: 'border-t-purple-400', WON: 'border-t-green-500', LOST: 'border-t-red-400',
};

interface Props {
  opportunities: Opportunity[];
  typeFilter: string;
}

export default function OpportunityKanban({ opportunities, typeFilter }: Props) {
  const navigate = useNavigate();

  const filtered = opportunities.filter(o =>
    typeFilter === 'ALL' || o.opportunity_type === typeFilter
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 min-w-max pb-4">
        {STAGES.map(stage => {
          const stageOpps = filtered.filter(o => o.stage === stage);
          const stageTotal = stageOpps.reduce((s, o) => s + (o.expected_value || 0), 0);

          return (
            <div key={stage} className="w-[260px] shrink-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{STAGE_LABELS[stage]}</span>
                  <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{stageOpps.length}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">฿{stageTotal.toLocaleString()}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[100px]">
                {stageOpps.map(opp => {
                  const account = getAccountById(opp.account_id);
                  const daysInStage = Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
                  const isStuck = daysInStage > 14 && !['WON', 'LOST'].includes(opp.stage);
                  const noActivity = !opp.next_activity_type;

                  return (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                      className={`p-3 rounded-lg border border-t-[3px] bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-2 ${STAGE_COLORS[stage]}`}
                    >
                      {/* Customer name */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-sm font-semibold text-foreground leading-tight flex items-center gap-1">
                          <Building2 size={12} className="text-muted-foreground shrink-0" />
                          {account?.clinic_name || '-'}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          {isStuck && <span className="text-destructive" aria-label="Stuck > 14 วัน"><Clock size={13} /></span>}
                          {noActivity && <span className="text-amber-500" aria-label="ไม่มีกิจกรรมถัดไป"><AlertTriangle size={13} /></span>}
                        </div>
                      </div>

                      {/* Product */}
                      <p className="text-xs text-muted-foreground truncate">
                        {(opp.interested_products || []).join(', ') || '-'}
                      </p>

                      {/* Bottom row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          ฿{(opp.expected_value || 0).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {opp.opportunity_type && (
                            <span className="px-1.5 py-0.5 rounded bg-muted">{opp.opportunity_type === 'DEVICE' ? 'เครื่อง' : 'สิ้นเปลือง'}</span>
                          )}
                          <span>{daysInStage}d</span>
                        </div>
                      </div>

                      {/* Sales owner */}
                      <p className="text-[10px] text-muted-foreground">{opp.assigned_sale || '-'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

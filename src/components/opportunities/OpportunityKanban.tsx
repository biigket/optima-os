import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Building2, Calendar, Phone, Eye, Users, Presentation, FileCheck } from 'lucide-react';
import { getAccountById } from '@/data/mockData';
import type { Opportunity, OpportunityStage } from '@/types';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/ค้นหา Need', DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost/Nurture',
};
const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'border-t-blue-500', CONTACTED: 'border-t-cyan-500', DEMO_SCHEDULED: 'border-t-amber-500',
  DEMO_DONE: 'border-t-orange-500', NEGOTIATION: 'border-t-purple-500', WON: 'border-t-emerald-500', LOST: 'border-t-destructive',
};

const PROBABILITY: Record<string, number> = {
  NEW_LEAD: 10, CONTACTED: 20, DEMO_SCHEDULED: 40, DEMO_DONE: 60, NEGOTIATION: 80, WON: 100, LOST: 0,
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  CALL: Phone, VISIT: Eye, DEMO: Presentation, MEETING: Users, PROPOSAL: FileCheck,
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
          const stageOpps = filtered
            .filter(o => o.stage === stage)
            // Sort by next activity date (closest first) — task-driven like Pipedrive
            .sort((a, b) => {
              if (!a.next_activity_date && !b.next_activity_date) return 0;
              if (!a.next_activity_date) return 1;
              if (!b.next_activity_date) return -1;
              return new Date(a.next_activity_date).getTime() - new Date(b.next_activity_date).getTime();
            });

          const stageTotal = stageOpps.reduce((s, o) => s + (o.expected_value || 0), 0);
          const prob = PROBABILITY[stage] || 0;
          const weightedTotal = Math.round(stageTotal * prob / 100);

          return (
            <div key={stage} className="w-[280px] shrink-0">
              {/* Column Header */}
              <div className={`rounded-t-lg px-3 py-2.5 border border-b-0 bg-muted/50`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">{STAGE_LABELS[stage]}</span>
                    <span className="text-[10px] bg-foreground/10 text-foreground rounded-full px-1.5 py-0.5 font-semibold">{stageOpps.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>฿{stageTotal.toLocaleString()}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-muted-foreground">Weighted ฿{weightedTotal.toLocaleString()}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{prob}%</span>
                </div>
              </div>

              {/* Cards container */}
              <div className="space-y-0 min-h-[120px] border border-t-0 rounded-b-lg bg-muted/20 p-2 space-y-2">
                {stageOpps.map(opp => (
                  <KanbanCard key={opp.id} opp={opp} stage={stage} navigate={navigate} />
                ))}
                {stageOpps.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                    ไม่มีดีล
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function KanbanCard({ opp, stage, navigate }: { opp: Opportunity; stage: OpportunityStage; navigate: ReturnType<typeof useNavigate> }) {
  const account = getAccountById(opp.account_id);
  const daysInStage = Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
  const isStuck = daysInStage > 14 && !['WON', 'LOST'].includes(stage);
  const noActivity = !opp.next_activity_type;
  const prob = PROBABILITY[stage] || 0;
  const weighted = Math.round((opp.expected_value || 0) * prob / 100);

  // Close date warning
  const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !['WON', 'LOST'].includes(stage);

  // Next activity
  const ActivityIcon = opp.next_activity_type ? (ACTIVITY_ICONS[opp.next_activity_type] || Calendar) : Calendar;
  const activityDaysLeft = opp.next_activity_date
    ? Math.ceil((new Date(opp.next_activity_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className={`p-3 rounded-lg border border-t-[3px] bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group ${STAGE_COLORS[stage]} ${isStuck ? 'ring-1 ring-destructive/30' : ''}`}
    >
      {/* ROW 1: Clinic name + Amount (most important) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground leading-tight truncate flex items-center gap-1.5">
            <Building2 size={12} className="text-muted-foreground shrink-0" />
            {account?.clinic_name || '-'}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {(opp.interested_products || []).join(', ') || '-'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">฿{(opp.expected_value || 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">W: ฿{weighted.toLocaleString()}</p>
        </div>
      </div>

      {/* ROW 2: Close date + Owner + Indicators */}
      <div className="flex items-center gap-2 text-[10px] mb-2 pb-2 border-b border-border">
        <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          <Calendar size={10} />
          {opp.close_date ? new Date(opp.close_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-muted-foreground truncate flex-1">{opp.assigned_sale || '-'}</span>
        <span className="text-muted-foreground/40">·</span>
        {opp.opportunity_type && (
          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {opp.opportunity_type === 'DEVICE' ? 'เครื่อง' : 'สิ้นเปลือง'}
          </span>
        )}
        <div className="flex gap-1 shrink-0">
          {isStuck && (
            <span className="text-destructive" title={`ค้าง ${daysInStage} วัน`}>
              <Clock size={12} />
            </span>
          )}
          {noActivity && (
            <span className="text-warning" title="ไม่มีกิจกรรมถัดไป">
              <AlertTriangle size={12} />
            </span>
          )}
        </div>
      </div>

      {/* ROW 3: Next Activity (the "action driver") */}
      {opp.next_activity_type ? (
        <div className="flex items-center gap-1.5 text-[11px]">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            activityDaysLeft !== null && activityDaysLeft <= 1 ? 'bg-destructive/15 text-destructive' :
            activityDaysLeft !== null && activityDaysLeft <= 3 ? 'bg-warning/15 text-warning' :
            'bg-accent/10 text-accent'
          }`}>
            <ActivityIcon size={10} />
          </div>
          <span className="text-foreground font-medium">{opp.next_activity_type}</span>
          <span className="text-muted-foreground ml-auto">
            {opp.next_activity_date ? new Date(opp.next_activity_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''}
          </span>
          {activityDaysLeft !== null && (
            <span className={`font-semibold ${
              activityDaysLeft <= 0 ? 'text-destructive' :
              activityDaysLeft <= 1 ? 'text-warning' :
              'text-muted-foreground'
            }`}>
              {activityDaysLeft <= 0 ? 'วันนี้!' : `${activityDaysLeft}d`}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-warning">
          <AlertTriangle size={11} />
          <span className="font-medium">ยังไม่มีกิจกรรมถัดไป</span>
        </div>
      )}

      {/* Stuck indicator bar */}
      {isStuck && (
        <div className="mt-2 text-[10px] text-destructive bg-destructive/5 rounded px-2 py-1 flex items-center gap-1">
          <Clock size={10} /> ค้างอยู่ {daysInStage} วัน
        </div>
      )}
    </div>
  );
}

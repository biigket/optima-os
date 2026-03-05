import { useState } from 'react';
import { Phone, Users, Building2, Target, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Activity } from '@/types';
import type { OpportunityNote } from '@/pages/OpportunitiesPage';

const TYPE_ICONS: Record<string, React.ElementType> = {
  CALL: Phone, MEETING: Users, TASK: Building2, DEADLINE: Target,
};

interface StageChange {
  from: string;
  to: string;
  date: string;
}

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/Need', DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost/Nurture',
};

interface HistoryTimelineProps {
  activities: Activity[];
  stageHistory: StageChange[];
  notes: OpportunityNote[];
}

type TimelineItem = {
  type: 'activity' | 'stage' | 'note';
  date: string;
  data: any;
};

export default function HistoryTimeline({ activities, stageHistory, notes }: HistoryTimelineProps) {
  const [filter, setFilter] = useState('all');

  const doneActivities = activities.filter(a => a.is_done);

  // Build unified timeline
  const items: TimelineItem[] = [];

  if (filter === 'all' || filter === 'activities') {
    doneActivities.forEach(a => items.push({ type: 'activity', date: a.created_at, data: a }));
  }
  if (filter === 'all' || filter === 'changelog') {
    stageHistory.forEach(s => items.push({ type: 'stage', date: s.date, data: s }));
  }
  if (filter === 'all' || filter === 'notes') {
    notes.forEach(n => items.push({ type: 'note', date: n.created_at, data: n }));
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">History</p>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="activities" className="text-[10px] h-5 px-2">Activities</TabsTrigger>
            <TabsTrigger value="notes" className="text-[10px] h-5 px-2">Notes</TabsTrigger>
            <TabsTrigger value="changelog" className="text-[10px] h-5 px-2">Changelog</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">ยังไม่มีประวัติ</p>
      ) : (
        <div className="relative pl-6 space-y-3">
          {/* Dashed line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px border-l border-dashed border-border" />

          {items.map((item, idx) => (
            <div key={idx} className="relative">
              {/* Timeline dot */}
              {item.type === 'activity' && <ActivityItem data={item.data} />}
              {item.type === 'stage' && <StageItem data={item.data} />}
              {item.type === 'note' && <NoteItem data={item.data} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ data }: { data: Activity }) {
  const Icon = TYPE_ICONS[data.activity_type] || Building2;
  return (
    <div className="flex items-start gap-2">
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
        <Icon size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{data.title}</span>
          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {data.activity_date}{data.start_time ? ` ${data.start_time}` : ''} · {data.activity_type}
        </p>
        {data.notes && <p className="text-[10px] text-muted-foreground mt-1 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">{data.notes}</p>}
      </div>
    </div>
  );
}

function StageItem({ data }: { data: { from: string; to: string; date: string } }) {
  return (
    <div className="flex items-start gap-2">
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full border-2 border-primary bg-card mt-0.5" />
      <div>
        <div className="flex items-center gap-1 text-xs text-foreground">
          <span className="font-medium">{STAGE_LABELS[data.from] || data.from}</span>
          <ArrowRight size={10} className="text-muted-foreground" />
          <span className="font-medium">{STAGE_LABELS[data.to] || data.to}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {new Date(data.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function NoteItem({ data }: { data: OpportunityNote }) {
  return (
    <div className="flex items-start gap-2">
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 flex items-center justify-center mt-0.5">
        <FileText size={10} />
      </div>
      <div className="flex-1">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
          <p className="text-xs text-foreground">{data.content}</p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {data.created_by} · {new Date(data.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

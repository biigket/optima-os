import { useState } from 'react';
import { Phone, Users, Building2, Target, FileText, ArrowRight, CheckCircle2, Pin, MoreHorizontal, MessageSquare, Pencil, Trash2, X, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Activity } from '@/types';
import type { OpportunityNote } from '@/pages/OpportunitiesPage';

const TYPE_ICONS: Record<string, React.ElementType> = {
  CALL: Phone, MEETING: Users, TASK: Building2, DEADLINE: Target,
};

const TYPE_COLORS: Record<string, string> = {
  CALL: 'text-blue-600 bg-blue-50', MEETING: 'text-violet-600 bg-violet-50',
  TASK: 'text-emerald-600 bg-emerald-50', DEADLINE: 'text-red-600 bg-red-50',
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
  onUpdateNote?: (id: string, content: string) => void;
  onDeleteNote?: (id: string) => void;
  onPinNote?: (id: string) => void;
  onDeleteActivity?: (id: string) => void;
  onAddComment?: (parentId: string, comment: string) => void;
  pinnedIds?: Set<string>;
  clinicName?: string;
}

type TimelineItem = {
  type: 'activity' | 'stage' | 'note';
  date: string;
  data: any;
};

export default function HistoryTimeline({ activities, stageHistory, notes, onUpdateNote, onDeleteNote, onPinNote, clinicName }: HistoryTimelineProps) {
  const [filter, setFilter] = useState('all');

  const doneActivities = activities.filter(a => a.is_done);

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
          <div className="absolute left-[9px] top-2 bottom-2 w-px border-l border-dashed border-border" />

          {items.map((item, idx) => (
            <div key={idx} className="relative">
              {item.type === 'activity' && <ActivityItem data={item.data} clinicName={clinicName} onDelete={onDeleteNote} onPin={onPinNote} />}
              {item.type === 'stage' && <StageItem data={item.data} />}
              {item.type === 'note' && (
                <NoteItem
                  data={item.data}
                  onUpdate={onUpdateNote}
                  onDelete={onDeleteNote}
                  onPin={onPinNote}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ data, clinicName, onDelete, onPin }: { data: Activity; clinicName?: string; onDelete?: (id: string) => void; onPin?: (id: string) => void }) {
  const Icon = TYPE_ICONS[data.activity_type] || Building2;
  const colors = TYPE_COLORS[data.activity_type] || TYPE_COLORS.TASK;
  return (
    <div className="flex items-start gap-2">
      <div className={`absolute -left-6 w-[18px] h-[18px] rounded-full ${colors} flex items-center justify-center mt-0.5`}>
        <Icon size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground flex-1">{data.title}</span>
          <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
          {data.priority === 'HIGH' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">HIGH</span>
          )}
          <div className="flex items-center gap-0.5">
            <button onClick={() => onPin?.(data.id)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Pin">
              <Pin size={11} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <MoreHorizontal size={11} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-[120px]">
                <DropdownMenuItem onClick={() => onPin?.(data.id)}>
                  <Pin size={11} className="mr-1.5" /> Pin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(data.id)} className="text-destructive">
                  <Trash2 size={11} className="mr-1.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {data.activity_date}{data.start_time ? ` ${data.start_time}` : ''} · {data.activity_type}
        </p>
        {clinicName && (
          <p className="text-[10px] text-muted-foreground">{clinicName}</p>
        )}
        {data.notes && (
          <p className="text-[10px] text-muted-foreground mt-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">{data.notes}</p>
        )}
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

function NoteItem({ data, onUpdate, onDelete, onPin }: {
  data: OpportunityNote;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onUpdate?.(data.id, editContent.trim());
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-2">
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 flex items-center justify-center mt-0.5">
        <FileText size={10} />
      </div>
      <div className="flex-1">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 group relative">
          {/* Action buttons - top right */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
            <button
              onClick={() => onPin?.(data.id)}
              className="p-1 rounded hover:bg-amber-200/50 text-amber-700 dark:text-amber-400"
              title="Pin this note"
            >
              <Pin size={11} />
            </button>
            <button
              onClick={() => setShowComment(!showComment)}
              className="p-1 rounded hover:bg-amber-200/50 text-amber-700 dark:text-amber-400"
              title="Add a comment"
            >
              <MessageSquare size={11} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-amber-200/50 text-amber-700 dark:text-amber-400">
                  <MoreHorizontal size={11} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-[120px]">
                <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(data.content); }}>
                  <Pencil size={11} className="mr-1.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPin?.(data.id)}>
                  <Pin size={11} className="mr-1.5" /> Pin this note
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(data.id)} className="text-destructive">
                  <Trash2 size={11} className="mr-1.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="text-xs min-h-[40px] bg-transparent border-amber-300 dark:border-amber-700"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)}>
                  <X size={10} className="mr-0.5" /> Cancel
                </Button>
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSaveEdit}>
                  <Check size={10} className="mr-0.5" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground pr-16">{data.content}</p>
          )}
        </div>

        {/* Comment input */}
        {showComment && (
          <div className="mt-1.5 ml-4 flex gap-1.5">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-[10px] h-6 px-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => { setComment(''); setShowComment(false); }}>
              Post
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-1">
          {data.created_by} · {new Date(data.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

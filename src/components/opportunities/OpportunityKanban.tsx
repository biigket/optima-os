import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Building2, Calendar, Phone, Eye, Users, Presentation, FileCheck, MoreHorizontal, Trophy, XCircle, Pencil, Pin, Send, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { getCachedAccount, type OpportunityNote } from '@/pages/OpportunitiesPage';
import { useMultiOpportunityNotes } from '@/hooks/useOpportunityNotes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QuickActivityForm from './QuickActivityForm';
import type { Opportunity, OpportunityStage } from '@/types';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'นัดพบ/ค้นหา Need', CONTACTED: 'Demo Schedule', DEMO_SCHEDULED: 'Demo/Workshop',
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
  CALL: Phone, VISIT: Eye, DEMO: Presentation, MEETING: Users, PROPOSAL: FileCheck, TASK: Calendar, DEADLINE: AlertTriangle,
};

const STUCK_REASONS = ['รอราคา', 'รอผู้ตัดสินใจ', 'รอ finance', 'รอ training', 'อื่นๆ'];

interface Activity {
  id: string;
  opportunity_id: string;
  account_id: string;
  activity_type: string;
  title: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  priority: string | null;
  is_done: boolean | null;
}

function getDaysInStage(opp: Opportunity): number {
  return Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
}

function getStuckColor(days: number): { bg: string; text: string; label: string } {
  if (days >= 7) return { bg: 'bg-destructive/10', text: 'text-destructive', label: 'แดง' };
  if (days >= 3) return { bg: 'bg-warning/10', text: 'text-warning', label: 'ส้ม' };
  return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'เขียว' };
}

interface Props {
  opportunities: Opportunity[];
  typeFilter: string;
  onStageChange: (oppId: string, newStage: OpportunityStage) => void;
  onUpdateOpportunity?: (oppId: string, updates: Partial<Opportunity>) => void;
  onAddNote?: (oppId: string, note: string) => void;
}

export default function OpportunityKanban({ opportunities, typeFilter, onStageChange, onUpdateOpportunity, onAddNote }: Props) {
  const navigate = useNavigate();
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [activitiesMap, setActivitiesMap] = useState<Record<string, Activity[]>>({});

  const oppIds = opportunities.map(o => o.id);
  const notesHook = useMultiOpportunityNotes(oppIds);

  const fetchActivities = useCallback(async () => {
    if (oppIds.length === 0) { setActivitiesMap({}); return; }
    const { data } = await supabase
      .from('activities')
      .select('id, opportunity_id, account_id, activity_type, title, activity_date, start_time, end_time, priority, is_done')
      .eq('is_done', false)
      .in('opportunity_id', oppIds)
      .order('activity_date', { ascending: true });
    if (data) {
      const map: Record<string, Activity[]> = {};
      (data as Activity[]).forEach(a => {
        if (!map[a.opportunity_id]) map[a.opportunity_id] = [];
        map[a.opportunity_id].push(a);
      });
      setActivitiesMap(map);
    }
  }, [oppIds.join(',')]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filtered = opportunities.filter(o =>
    typeFilter === 'ALL' || o.opportunity_type === typeFilter
  );

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => { setDragOverStage(null); };

  const handleDrop = (e: React.DragEvent, newStage: OpportunityStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const oppId = e.dataTransfer.getData('text/plain');
    if (!oppId) return;
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp || opp.stage === newStage) return;
    const account = getCachedAccount(opp.account_id);
    onStageChange(oppId, newStage);
    toast.success(`ย้าย ${account?.clinic_name || '-'} → ${STAGE_LABELS[newStage]}`);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 min-w-max pb-4">
        {STAGES.map(stage => {
          const stageOpps = filtered
            .filter(o => o.stage === stage)
            .sort((a, b) => {
              if (!a.next_activity_date && !b.next_activity_date) return 0;
              if (!a.next_activity_date) return 1;
              if (!b.next_activity_date) return -1;
              return new Date(a.next_activity_date).getTime() - new Date(b.next_activity_date).getTime();
            });

          const stageTotal = stageOpps.reduce((s, o) => s + (o.expected_value || 0), 0);
          const prob = PROBABILITY[stage] || 0;
          const weightedTotal = Math.round(stageTotal * prob / 100);
          const isDragOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className="w-[280px] shrink-0"
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="rounded-t-lg px-3 py-2.5 border border-b-0 bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">{STAGE_LABELS[stage]}</span>
                    <span className="text-[10px] bg-foreground/10 text-foreground rounded-full px-1.5 py-0.5 font-semibold">{stageOpps.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>฿{stageTotal.toLocaleString()}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>Weighted ฿{weightedTotal.toLocaleString()}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{prob}%</span>
                </div>
              </div>

              <div className={`min-h-[120px] border border-t-0 rounded-b-lg bg-muted/20 p-2 space-y-2 transition-all ${isDragOver ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                {stageOpps.map(opp => (
                  <KanbanCard
                    key={opp.id}
                    opp={opp}
                    stage={stage}
                    navigate={navigate}
                    pendingActivities={activitiesMap[opp.id] || []}
                    onStageChange={onStageChange}
                    onUpdateOpportunity={onUpdateOpportunity}
                    onActivitySaved={fetchActivities}
                    notesHook={notesHook}
                  />
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

/* ─── Kanban Card ─── */

function KanbanCard({ opp, stage, navigate, pendingActivities, onStageChange, onUpdateOpportunity, onActivitySaved }: {
  opp: Opportunity;
  stage: OpportunityStage;
  navigate: ReturnType<typeof useNavigate>;
  pendingActivities: Activity[];
  onStageChange: (oppId: string, newStage: OpportunityStage) => void;
  onUpdateOpportunity?: (oppId: string, updates: Partial<Opportunity>) => void;
  onActivitySaved: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [otherReason, setOtherReason] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [quickFormType, setQuickFormType] = useState<'CALL' | 'MEETING' | 'DEMO' | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const account = getCachedAccount(opp.account_id);
  const daysInStage = getDaysInStage(opp);
  const isTerminal = ['WON', 'LOST'].includes(stage);
  const noActivity = !opp.next_activity_type;
  const prob = PROBABILITY[stage] || 0;
  const weighted = Math.round((opp.expected_value || 0) * prob / 100);
  const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !isTerminal;
  const ActivityIcon = opp.next_activity_type ? (ACTIVITY_ICONS[opp.next_activity_type] || Calendar) : Calendar;
  const activityDaysLeft = opp.next_activity_date
    ? Math.ceil((new Date(opp.next_activity_date).getTime() - Date.now()) / 86400000)
    : null;

  const stuckColor = !isTerminal ? getStuckColor(daysInStage) : null;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', opp.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => { setIsDragging(false); };

  const handleStuckReasonChange = (val: string) => {
    setShowOtherInput(val === 'อื่นๆ');
    onUpdateOpportunity?.(opp.id, { stuck_reason: val } as any);
  };

  const handleSaveOtherReason = () => {
    if (otherReason.trim()) {
      onUpdateOpportunity?.(opp.id, { stuck_reason: `อื่นๆ: ${otherReason.trim()}` } as any);
      toast.success('บันทึกเหตุผลแล้ว');
    }
  };

  // Show max 3 pending activities
  const visibleActivities = pendingActivities.slice(0, 3);
  const moreCount = pendingActivities.length - 3;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => navigate(`/opportunities/${opp.id}`)}
      className={`p-3 rounded-lg border border-t-[3px] bg-card shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${STAGE_COLORS[stage]} ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      {/* ROW 1: Clinic name + Amount */}
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

      {/* ROW 2: Close date + Owner + Days indicator */}
      <div className="flex items-center gap-2 text-[10px] mb-2 pb-2 border-b border-border">
        <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          <Calendar size={10} />
          {opp.close_date ? new Date(opp.close_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="text-muted-foreground truncate flex-1">{opp.assigned_sale || '-'}</span>
        {stuckColor && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className={`flex items-center gap-0.5 font-semibold ${stuckColor.text}`} title={`อยู่ในสถานะ ${daysInStage} วัน`}>
              <Clock size={10} />
              {daysInStage}d
            </span>
          </>
        )}
        {noActivity && !isTerminal && (
          <span className="text-warning" title="ไม่มีกิจกรรมถัดไป">
            <AlertTriangle size={12} />
          </span>
        )}
      </div>

      {/* ROW 3: Pending Activities */}
      {pendingActivities.length > 0 ? (
        <div className="space-y-1.5">
          {visibleActivities.map(a => {
            const Icon = ACTIVITY_ICONS[a.activity_type] || Calendar;
            const isHigh = a.priority === 'HIGH';
            const actDate = new Date(a.activity_date);
            const today = new Date(); today.setHours(0,0,0,0);
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            const isToday = actDate.toDateString() === today.toDateString();
            const isTomorrow = actDate.toDateString() === tomorrow.toDateString();
            const dateLabel = isToday ? 'วันนี้' : isTomorrow ? 'พรุ่งนี้' : actDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
            const dateColor = isToday ? 'text-destructive font-bold' : isTomorrow ? 'text-warning font-semibold' : '';
            const rowColor = isHigh ? 'text-destructive' : 'text-muted-foreground';
            const timeRange = a.start_time && a.end_time ? `${a.start_time}-${a.end_time}` : a.start_time || '';

            return (
              <div key={a.id} className={`text-xs ${rowColor}`}>
                <div className="flex items-center gap-1.5">
                  <button
                    className="shrink-0 w-4 h-4 rounded-full border border-current flex items-center justify-center self-center hover:bg-muted transition-colors"
                    title="เสร็จสิ้น"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from('activities').update({ is_done: true }).eq('id', a.id);
                      onActivitySaved();
                      toast.success('เสร็จสิ้นกิจกรรม');
                    }}
                  >
                    <span className="text-[8px]">✓</span>
                  </button>
                  <Icon size={12} className="shrink-0" />
                  <span className="font-medium truncate flex-1">{a.title}</span>
                  <Popover open={editingActivity?.id === a.id} onOpenChange={(open) => setEditingActivity(open ? a : null)}>
                    <PopoverTrigger asChild>
                      <button
                        className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                        title="แก้ไข"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Pencil size={10} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" side="top" className="w-64 p-3" onClick={e => e.stopPropagation()}>
                      <EditActivityForm
                        activity={a}
                        onSaved={() => { setEditingActivity(null); onActivitySaved(); }}
                        onClose={() => setEditingActivity(null)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-1.5 ml-[calc(1rem+0.375rem+12px+0.375rem)] text-[11px]">
                  {timeRange && <span>{timeRange}</span>}
                  {timeRange && <span className="opacity-40">·</span>}
                  <span className={dateColor || 'inherit'}>{dateLabel}</span>
                </div>
              </div>
            );
          })}
          {moreCount > 0 && (
            <p className="text-[11px] text-muted-foreground/60 ml-[calc(1rem+0.375rem)]">+{moreCount} รายการ</p>
          )}
        </div>
      ) : !isTerminal ? (
        <div className="text-[11px] text-warning font-medium py-1">⚠ ไม่มี Next Activity</div>
      ) : null}

      {/* ROW 4: Pinned Notes + Quick Add */}
      <PinnedNotesRow oppId={opp.id} accountId={opp.account_id} isTerminal={isTerminal} />

      {/* Stuck reason (days >= 3) */}
      {!isTerminal && daysInStage >= 3 && (
        <div className={`mt-2 text-[10px] rounded px-2 py-1.5 space-y-1 ${stuckColor!.bg}`}>
          <div className={`flex items-center gap-1 font-semibold ${stuckColor!.text}`}>
            <Clock size={10} /> อยู่ในสถานะ {daysInStage} วัน
          </div>
          <div onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <Select
              value={(opp as any).stuck_reason?.startsWith('อื่นๆ') ? 'อื่นๆ' : (opp as any).stuck_reason || ''}
              onValueChange={handleStuckReasonChange}
            >
              <SelectTrigger className="h-5 text-[10px] bg-background/50 border-border px-1.5">
                <SelectValue placeholder="เลือกเหตุผล..." />
              </SelectTrigger>
              <SelectContent>
                {STUCK_REASONS.map(r => (
                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(showOtherInput || (opp as any).stuck_reason?.startsWith('อื่นๆ')) && (
              <div className="mt-1 flex gap-1">
                <Input
                  value={otherReason}
                  onChange={e => setOtherReason(e.target.value)}
                  placeholder="ระบุเหตุผล..."
                  className="h-5 text-[10px] flex-1"
                  onClick={e => e.stopPropagation()}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveOtherReason(); }}
                  className="px-1.5 h-5 text-[10px] bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  บันทึก
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer: Quick shortcuts + Pipeline dropdown */}
      <div className="flex items-center mt-2 pt-2 border-t border-border">
        {/* Quick Activity Shortcuts */}
        {!isTerminal && (
          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            {([
              { type: 'CALL' as const, icon: Phone, label: 'โทร' },
              { type: 'MEETING' as const, icon: Users, label: 'นัดพบ' },
              { type: 'DEMO' as const, icon: Presentation, label: 'เดโม' },
            ]).map(({ type, icon: Icon, label }) => (
              <Popover key={type} open={quickFormType === type} onOpenChange={(open) => setQuickFormType(open ? type : null)}>
                <PopoverTrigger asChild>
                  <button
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={label}
                    onClick={e => { e.stopPropagation(); }}
                  >
                    <Icon size={12} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" side="top" className="w-auto p-3" onClick={e => e.stopPropagation()}>
                  <QuickActivityForm
                    activityType={type}
                    opportunityId={opp.id}
                    accountId={opp.account_id}
                    onSaved={onActivitySaved}
                    onClose={() => setQuickFormType(null)}
                  />
                </PopoverContent>
              </Popover>
            ))}
          </div>
        )}

        <div className="ml-auto" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                แก้ไข
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {STAGES.filter(s => s !== stage).map(s => (
                <DropdownMenuItem
                  key={s}
                  className="text-xs"
                  onClick={() => {
                    onStageChange(opp.id, s);
                    toast.success(`ย้าย ${account?.clinic_name} → ${STAGE_LABELS[s]}`);
                  }}
                >
                  → {STAGE_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-emerald-600" onClick={() => {
                onStageChange(opp.id, 'WON');
                toast.success(`🎉 ${account?.clinic_name} — Won!`);
              }}>
                <Trophy size={12} className="mr-1" /> Mark Won
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-destructive" onClick={() => {
                onStageChange(opp.id, 'LOST');
                toast.info(`${account?.clinic_name} — Lost`);
              }}>
                <XCircle size={12} className="mr-1" /> Mark Lost
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ─── Pinned Notes Row ─── */

function PinnedNotesRow({ oppId, accountId, isTerminal }: { oppId: string; accountId: string; isTerminal: boolean }) {
  const [noteInput, setNoteInput] = useState('');
  const [editingNote, setEditingNote] = useState<OpportunityNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [, forceUpdate] = useState(0);

  const pinnedIds = getPinnedIdsGlobal();
  const notes = getNotesForOpportunity(oppId);
  const pinnedNotes = notes.filter(n => pinnedIds.has(n.id));

  const handleQuickAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!noteInput.trim()) return;
    const note: OpportunityNote = {
      id: `note-${Date.now()}`,
      opportunity_id: oppId,
      account_id: accountId,
      content: noteInput.trim(),
      created_by: 'Me',
      created_at: new Date().toISOString(),
    };
    addNoteGlobal(note);
    togglePinGlobal(note.id);
    setNoteInput('');
    forceUpdate(n => n + 1);
  };

  const handleEditSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingNote || !editContent.trim()) return;
    updateNoteGlobal(editingNote.id, editContent.trim());
    setEditingNote(null);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-1 mt-1.5 pt-1.5 border-t border-border" onClick={e => e.stopPropagation()}>
      {pinnedNotes.map(note => (
        <div key={note.id} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Pin size={14} className="shrink-0 text-primary fill-primary" />
          <span className="truncate flex-1">{note.content}</span>
          <Popover open={editingNote?.id === note.id} onOpenChange={(open) => {
            if (open) { setEditingNote(note); setEditContent(note.content); }
            else setEditingNote(null);
          }}>
            <PopoverTrigger asChild>
              <button className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
                <Pencil size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" className="w-52 p-2" onClick={e => e.stopPropagation()}>
              <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-7 text-xs mb-1.5" />
              <div className="flex gap-1">
                <button onClick={() => setEditingNote(null)} className="flex-1 h-6 text-[10px] rounded border border-border hover:bg-muted">ยกเลิก</button>
                <button onClick={handleEditSave} className="flex-1 h-6 text-[10px] rounded bg-primary text-primary-foreground hover:bg-primary/90">บันทึก</button>
              </div>
            </PopoverContent>
          </Popover>
          <button
            className="shrink-0 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="ลบ"
            onClick={e => {
              e.stopPropagation();
              deleteNoteGlobal(note.id);
              forceUpdate(n => n + 1);
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      {!isTerminal && (
        <div className="flex items-center gap-1">
          <Input
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="เพิ่มบันทึก..."
            className="h-6 text-[10px] flex-1"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(e); }}
          />
          <button
            onClick={handleQuickAdd}
            disabled={!noteInput.trim()}
            className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <Send size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Activity Form ─── */

function EditActivityForm({ activity, onSaved, onClose }: {
  activity: Activity;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(activity.title);
  const [date, setDate] = useState(activity.activity_date);
  const [startTime, setStartTime] = useState(activity.start_time || '');
  const [endTime, setEndTime] = useState(activity.end_time || '');
  const [priority, setPriority] = useState(activity.priority || 'NORMAL');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('activities').update({
      title,
      activity_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      priority,
    }).eq('id', activity.id);
    setSaving(false);
    toast.success('อัปเดตกิจกรรมแล้ว');
    onSaved();
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  return (
    <div className="space-y-2" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-foreground mb-2">แก้ไขกิจกรรม</p>
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="ชื่อกิจกรรม"
        className="h-7 text-xs"
      />
      <Input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="h-7 text-xs"
      />
      <div className="flex gap-1">
        <Select value={startTime} onValueChange={setStartTime}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue placeholder="เริ่ม" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={endTime} onValueChange={setEndTime}>
          <SelectTrigger className="h-7 text-xs flex-1">
            <SelectValue placeholder="สิ้นสุด" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="LOW" className="text-xs">Low</SelectItem>
          <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
          <SelectItem value="HIGH" className="text-xs">High</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-1 pt-1">
        <button onClick={onClose} className="flex-1 h-7 text-xs rounded border border-border hover:bg-muted">ยกเลิก</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 h-7 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">บันทึก</button>
      </div>
    </div>
  );
}

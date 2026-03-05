import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Clock, AlertTriangle, Building2, Calendar, Phone, Eye, Users, Presentation, FileCheck, MoreHorizontal, Trophy, XCircle, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getCachedAccount } from '@/pages/OpportunitiesPage';
import { toast } from 'sonner';
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

const STUCK_REASONS = ['รอราคา', 'รอผู้ตัดสินใจ', 'รอ finance', 'รอ training', 'อื่นๆ'];

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

  const filtered = opportunities.filter(o =>
    typeFilter === 'ALL' || o.opportunity_type === typeFilter
  );

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

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
                    onStageChange={onStageChange}
                    onUpdateOpportunity={onUpdateOpportunity}
                    onAddNote={onAddNote}
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

function KanbanCard({ opp, stage, navigate, onStageChange, onUpdateOpportunity, onAddNote }: {
  opp: Opportunity;
  stage: OpportunityStage;
  navigate: ReturnType<typeof useNavigate>;
  onStageChange: (oppId: string, newStage: OpportunityStage) => void;
  onUpdateOpportunity?: (oppId: string, updates: Partial<Opportunity>) => void;
  onAddNote?: (oppId: string, note: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [otherReason, setOtherReason] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

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

  // Color-coded days indicator (always show for non-terminal)
  const stuckColor = !isTerminal ? getStuckColor(daysInStage) : null;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', opp.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleStuckReasonChange = (val: string) => {
    if (val === 'อื่นๆ') {
      setShowOtherInput(true);
      onUpdateOpportunity?.(opp.id, { stuck_reason: val } as any);
    } else {
      setShowOtherInput(false);
      onUpdateOpportunity?.(opp.id, { stuck_reason: val } as any);
    }
  };

  const handleSaveOtherReason = () => {
    if (otherReason.trim()) {
      onUpdateOpportunity?.(opp.id, { stuck_reason: `อื่นๆ: ${otherReason.trim()}` } as any);
      toast.success('บันทึกเหตุผลแล้ว');
    }
  };

  const handleSaveNote = () => {
    if (quickNote.trim()) {
      onAddNote?.(opp.id, quickNote.trim());
      setQuickNote('');
      setShowNoteInput(false);
      toast.success('บันทึกโน้ตแล้ว');
    }
  };

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
        <span className="text-muted-foreground/40">·</span>
        {opp.opportunity_type && (
          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {opp.opportunity_type === 'DEVICE' ? 'เครื่อง' : 'สิ้นเปลือง'}
          </span>
        )}
        {/* Color-coded days indicator */}
        {stuckColor && (
          <span className={`flex items-center gap-0.5 font-semibold ${stuckColor.text}`} title={`อยู่ในสถานะ ${daysInStage} วัน`}>
            <Clock size={10} />
            {daysInStage}d
          </span>
        )}
        {noActivity && !isTerminal && (
          <span className="text-warning" title="ไม่มีกิจกรรมถัดไป">
            <AlertTriangle size={12} />
          </span>
        )}
      </div>

      {/* ROW 3: Next Activity */}
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
        !isTerminal && (
          <div className="flex items-center gap-1.5 text-[11px] text-warning">
            <AlertTriangle size={11} />
            <span className="font-medium">ยังไม่มีกิจกรรมถัดไป</span>
          </div>
        )
      )}

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

      {/* Quick Note input */}
      {showNoteInput && (
        <div className="mt-2" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          <div className="flex gap-1">
            <Input
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              placeholder="พิมพ์บันทึก..."
              className="h-6 text-[10px] flex-1"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveNote(); if (e.key === 'Escape') setShowNoteInput(false); }}
            />
            <button
              onClick={handleSaveNote}
              className="px-1.5 h-6 text-[10px] bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              บันทึก
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions — always visible */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
        <button
          onClick={(e) => { e.stopPropagation(); toast.info(`โทรหา ${account?.clinic_name}`); }}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="โทร"
        >
          <Phone size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toast.info('นัดกิจกรรม'); }}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="นัดกิจกรรม"
        >
          <Calendar size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowNoteInput(!showNoteInput); }}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="บันทึกภายใน"
        >
          <MessageSquare size={12} />
        </button>
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

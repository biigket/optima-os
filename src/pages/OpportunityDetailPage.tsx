import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ArrowLeft, Building2, ExternalLink, Users, Calendar, Clock,
  Phone, Eye, Presentation, FileCheck, AlertTriangle, Pencil, Trophy, XCircle, Check, MessageSquare, Send
} from 'lucide-react';
import { mockAccounts, mockContacts } from '@/data/mockData';
import { useMockAuth } from '@/hooks/useMockAuth';
import { getNotesForOpportunity, addNoteGlobal, type OpportunityNote } from '@/pages/OpportunitiesPage';
import { toast } from 'sonner';
import type { Opportunity, OpportunityStage } from '@/types';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/Need', DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost/Nurture',
};
const PROBABILITY: Record<string, number> = {
  NEW_LEAD: 10, CONTACTED: 20, DEMO_SCHEDULED: 40, DEMO_DONE: 60, NEGOTIATION: 80, WON: 100, LOST: 0,
};
const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  CALL: Phone, VISIT: Eye, DEMO: Presentation, MEETING: Users, PROPOSAL: FileCheck,
};
const STUCK_REASONS = ['รอราคา', 'รอผู้ตัดสินใจ', 'รอ finance', 'รอ training', 'อื่นๆ'];

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();

  // This page currently only works for opportunities created in-session (mock state lives in OpportunitiesPage)
  // For now show a placeholder if navigated directly
  const [opp, setOpp] = useState<Opportunity | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [stageConfirm, setStageConfirm] = useState<OpportunityStage | null>(null);
  const [stageHistory, setStageHistory] = useState<{ from: string; to: string; date: string }[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [, forceUpdate] = useState(0);

  const [editForm, setEditForm] = useState({
    expected_value: '',
    close_date: '',
    notes: '',
    next_activity_type: '',
    next_activity_date: '',
  });

  // Find account & contacts from mock data
  const account = opp ? mockAccounts.find(a => a.id === opp.account_id) : null;
  const contacts = opp ? mockContacts.filter(c => c.account_id === opp.account_id) : [];

  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">ไม่พบโอกาสขาย หรือดีลนี้ยังไม่ได้สร้างในเซสชันนี้</p>
        <Button variant="outline" onClick={() => navigate('/opportunities')}><ArrowLeft size={14} className="mr-1" /> กลับ Pipeline</Button>
      </div>
    );
  }

  const stageIdx = STAGES.indexOf(opp.stage);
  const daysInStage = Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
  const isStuck = daysInStage > 14 && !['WON', 'LOST'].includes(opp.stage);
  const prob = PROBABILITY[opp.stage] || 0;
  const weighted = Math.round((opp.expected_value || 0) * prob / 100);
  const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !['WON', 'LOST'].includes(opp.stage);
  const ActivityIcon = opp.next_activity_type ? (ACTIVITY_ICONS[opp.next_activity_type] || Calendar) : Calendar;
  const notes = getNotesForOpportunity(opp.id);

  const changeStage = (newStage: OpportunityStage) => {
    const oldStage = opp.stage;
    setStageHistory(prev => [...prev, { from: oldStage, to: newStage, date: new Date().toISOString() }]);
    setOpp(prev => prev ? { ...prev, stage: newStage } : prev);
    toast.success(`ย้ายไป ${STAGE_LABELS[newStage]}`);
    setStageConfirm(null);
  };

  const openEdit = () => {
    setEditForm({
      expected_value: String(opp.expected_value || ''),
      close_date: opp.close_date || '',
      notes: opp.notes || '',
      next_activity_type: opp.next_activity_type || '',
      next_activity_date: opp.next_activity_date || '',
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    const updates = {
      expected_value: Number(editForm.expected_value) || opp.expected_value,
      close_date: editForm.close_date || opp.close_date,
      notes: editForm.notes,
      next_activity_type: editForm.next_activity_type || opp.next_activity_type,
      next_activity_date: editForm.next_activity_date || opp.next_activity_date,
    };
    setOpp(prev => prev ? { ...prev, ...updates } : prev);
    setEditOpen(false);
    toast.success('บันทึกแล้ว');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const note: OpportunityNote = {
      id: `note-${Date.now()}`,
      opportunity_id: opp.id,
      account_id: opp.account_id,
      content: noteInput.trim(),
      created_by: currentUser?.name || 'Unknown',
      created_at: new Date().toISOString(),
    };
    addNoteGlobal(note);
    setNoteInput('');
    forceUpdate(n => n + 1);
    toast.success('บันทึกโน้ตแล้ว');
  };

  return (
    <div className="animate-fade-in max-w-[960px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="gap-1 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft size={16} /> กลับ Pipeline
        </Button>
        {!['WON', 'LOST'].includes(opp.stage) && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => changeStage('WON')}>
              <Trophy size={14} /> Mark Won
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => changeStage('LOST')}>
              <XCircle size={14} /> Mark Lost
            </Button>
          </div>
        )}
      </div>

      {/* Customer Header */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Building2 size={16} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">{account?.clinic_name || '-'}</h1>
          {account && <StatusBadge status={account.customer_status} />}
          <button onClick={() => navigate(`/leads/${opp.account_id}`)} className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto">
            <ExternalLink size={11} /> Customer Card
          </button>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>🧑‍💼 {opp.assigned_sale || '-'}</span>
          <span className="flex items-center gap-1"><Users size={10} /> {contacts.length} ผู้ติดต่อ</span>
          {isStuck && <span className="text-destructive flex items-center gap-1"><Clock size={10} /> ค้าง {daysInStage} วัน</span>}
        </div>
      </div>

      {/* Clickable Stage Path */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex gap-0 overflow-x-auto">
          {STAGES.map((s, i) => {
            const isCurrent = s === opp.stage;
            const isPast = i < stageIdx;
            const isLost = opp.stage === 'LOST';
            return (
              <div key={s} className="flex-1 min-w-[90px]">
                <button
                  onClick={() => { if (s !== opp.stage) setStageConfirm(s); }}
                  className={`w-full h-9 flex items-center justify-center text-[10px] font-semibold relative transition-all hover:opacity-80
                    ${isCurrent ? (isLost ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground') :
                      isPast ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                    ${i === 0 ? 'rounded-l-lg' : ''} ${i === STAGES.length - 1 ? 'rounded-r-lg' : ''}
                  `}
                >
                  {isCurrent && <Check size={10} className="mr-0.5" />}
                  {STAGE_LABELS[s]}
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span>Probability: <strong className="text-foreground">{prob}%</strong></span>
          <span className="text-muted-foreground/40">·</span>
          <span>อยู่ในสถานะนี้ <strong className={isStuck ? 'text-destructive' : 'text-foreground'}>{daysInStage} วัน</strong></span>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deal Info */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Info</p>
            <button onClick={openEdit} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Pencil size={12} />
            </button>
          </div>
          <InfoRow label="ประเภท" value={opp.opportunity_type === 'DEVICE' ? 'เครื่องมือ' : opp.opportunity_type === 'CONSUMABLE' ? 'สิ้นเปลือง' : '-'} />
          <InfoRow label="สินค้า" value={(opp.interested_products || []).join(', ') || '-'} />
          <InfoRow label="มูลค่า" value={`฿${(opp.expected_value || 0).toLocaleString()}`} highlight />
          <InfoRow label="Weighted" value={`฿${weighted.toLocaleString()}`} />
          {opp.quantity && <InfoRow label="จำนวน" value={`${opp.quantity}`} />}
          <InfoRow label="วันปิด" value={opp.close_date || '-'} warn={!!isOverdue} />
          <InfoRow label="หมายเหตุ" value={opp.notes || '-'} />

          {isStuck && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-destructive font-medium mb-1">เหตุผลที่ค้าง</p>
              <Select
                value={(opp as any).stuck_reason || ''}
                onValueChange={(val) => setOpp(prev => prev ? { ...prev, stuck_reason: val } as any : prev)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="เลือกเหตุผล..." />
                </SelectTrigger>
                <SelectContent>
                  {STUCK_REASONS.map(r => (
                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Next Actions */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Actions</p>
          {opp.next_activity_type ? (
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                  <ActivityIcon size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{opp.next_activity_type}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} /> {opp.next_activity_date}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning flex items-center gap-2">
              <AlertTriangle size={14} />
              <span className="font-medium">ยังไม่มีกิจกรรมถัดไป — ควรเพิ่มทันที!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => toast.info(`โทรหา ${account?.clinic_name}`)}><Phone size={11} /> โทร</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => toast.info('นัดเยี่ยม')}><Eye size={11} /> นัดเยี่ยม</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => toast.info('นัด Demo')}><Presentation size={11} /> นัด Demo</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => toast.info('ส่ง Proposal')}><FileCheck size={11} /> ส่ง Proposal</Button>
          </div>
        </div>

        {/* Stakeholders */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stakeholders</p>
          {contacts.map(c => (
            <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {c.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.role || '-'}</p>
              </div>
              {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
            </div>
          ))}
          {contacts.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">ไม่มีผู้ติดต่อ</p>}
        </div>
      </div>

      {/* Internal Notes */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <MessageSquare size={13} /> บันทึกภายใน
        </p>
        
        <div className="flex gap-2 mb-4">
          <Input
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="เพิ่มบันทึก..."
            className="h-8 text-sm flex-1"
            onKeyDown={e => { if (e.key === 'Enter') handleAddNote(); }}
          />
          <Button size="sm" className="h-8 gap-1" onClick={handleAddNote} disabled={!noteInput.trim()}>
            <Send size={12} /> บันทึก
          </Button>
        </div>

        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map(n => (
              <div key={n.id} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">{n.created_by}</span>
                  <span>·</span>
                  <span>{new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-foreground">{n.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีบันทึก</p>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activity Timeline</p>
        {stageHistory.length > 0 ? (
          <div className="space-y-2">
            {stageHistory.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground">{new Date(h.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-foreground">ย้ายจาก <strong>{STAGE_LABELS[h.from]}</strong> → <strong>{STAGE_LABELS[h.to]}</strong></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
            กิจกรรมจะแสดงเมื่อมีการเปลี่ยน Stage
          </div>
        )}
      </div>

      {/* Stage Confirm Dialog */}
      <Dialog open={!!stageConfirm} onOpenChange={() => setStageConfirm(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">ย้ายไป {stageConfirm ? STAGE_LABELS[stageConfirm] : ''}?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setStageConfirm(null)}>ยกเลิก</Button>
            <Button size="sm" onClick={() => stageConfirm && changeStage(stageConfirm)}>ยืนยัน</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">แก้ไขข้อมูลดีล</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">มูลค่า (฿)</label>
              <Input type="number" value={editForm.expected_value} onChange={e => setEditForm(f => ({ ...f, expected_value: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">วันปิด</label>
              <Input type="date" value={editForm.close_date} onChange={e => setEditForm(f => ({ ...f, close_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">กิจกรรมถัดไป</label>
              <Select value={editForm.next_activity_type} onValueChange={v => setEditForm(f => ({ ...f, next_activity_type: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="เลือก..." /></SelectTrigger>
                <SelectContent>
                  {['CALL', 'VISIT', 'DEMO', 'MEETING', 'PROPOSAL'].map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">วันกิจกรรม</label>
              <Input type="date" value={editForm.next_activity_date} onChange={e => setEditForm(f => ({ ...f, next_activity_date: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">หมายเหตุ</label>
              <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="text-sm min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button size="sm" onClick={saveEdit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right ${highlight ? 'font-bold text-foreground' : warn ? 'text-destructive font-medium' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

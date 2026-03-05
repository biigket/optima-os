import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ArrowLeft, Building2, ExternalLink, Users, Calendar, Clock,
  Pencil, Trophy, XCircle, Check, Send, ChevronDown, ChevronUp, Plus, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import { getNotesForOpportunity, addNoteGlobal, type OpportunityNote } from '@/pages/OpportunitiesPage';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import type { Opportunity, OpportunityStage, Account, Contact, Activity } from '@/types';
import ActivityForm from '@/components/opportunity-detail/ActivityForm';
import FocusPanel from '@/components/opportunity-detail/FocusPanel';
import HistoryTimeline from '@/components/opportunity-detail/HistoryTimeline';
import CalendarPanel from '@/components/opportunity-detail/CalendarPanel';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/Need', DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost/Nurture',
};
const STUCK_REASONS = ['รอราคา', 'รอผู้ตัดสินใจ', 'รอ finance', 'รอ training', 'อื่นๆ'];
const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'เงินสด', LEASING: 'ลีสซิ่ง',
  'CREDIT_CARD:FULL': 'บัตรเครดิต (รูดเต็ม)', 'CREDIT_CARD:INST_3': 'บัตรเครดิต (ผ่อน 3 ด.)',
  'CREDIT_CARD:INST_6': 'บัตรเครดิต (ผ่อน 6 ด.)', 'CREDIT_CARD:INST_10': 'บัตรเครดิต (ผ่อน 10 ด.)',
  CREDIT_CARD: 'บัตรเครดิต',
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();

  const [opp, setOpp] = useState<Opportunity | undefined>(undefined);
  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [authorityContact, setAuthorityContact] = useState<Contact | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [stageConfirm, setStageConfirm] = useState<OpportunityStage | null>(null);
  const [stageHistory, setStageHistory] = useState<{ from: string; to: string; date: string }[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [, forceUpdate] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stakeholdersOpen, setStakeholdersOpen] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '' });

  const [editForm, setEditForm] = useState({
    expected_value: '', close_date: '', notes: '',
  });

  // Fetch opportunity
  useEffect(() => {
    if (!id) return;
    supabase.from('opportunities').select('*').eq('id', id).single().then(({ data, error }) => {
      if (data) setOpp(data as unknown as Opportunity);
      if (error) console.error('Failed to fetch opportunity:', error);
    });
  }, [id]);

  // Fetch account & contacts
  useEffect(() => {
    if (!opp) return;
    supabase.from('accounts').select('*').eq('id', opp.account_id).single().then(({ data }) => {
      if (data) setAccount(data as unknown as Account);
    });
    supabase.from('contacts').select('*').eq('account_id', opp.account_id).then(({ data }) => {
      if (data) setContacts(data as unknown as Contact[]);
    });
  }, [opp?.account_id]);

  // Fetch authority contact
  useEffect(() => {
    if (!opp?.authority_contact_id) { setAuthorityContact(null); return; }
    supabase.from('contacts').select('*').eq('id', opp.authority_contact_id).single().then(({ data }) => {
      if (data) setAuthorityContact(data as unknown as Contact);
    });
  }, [opp?.authority_contact_id]);

  // Fetch activities
  useEffect(() => {
    if (!id) return;
    supabase.from('activities').select('*').eq('opportunity_id', id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setActivities(data as unknown as Activity[]); });
  }, [id]);

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
  const prob = opp.probability ?? 0;
  const weighted = Math.round((opp.expected_value || 0) * prob / 100);
  const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !['WON', 'LOST'].includes(opp.stage);
  const closeDateDays = opp.close_date ? differenceInDays(new Date(opp.close_date), new Date()) : null;
  const notes = getNotesForOpportunity(opp.id);
  const competitorTags = opp.competitors ? opp.competitors.split(',').map(s => s.trim()).filter(Boolean) : [];
  const deviceTags = opp.current_devices ? opp.current_devices.split(',').map(s => s.trim()).filter(Boolean) : [];

  const changeStage = async (newStage: OpportunityStage) => {
    const oldStage = opp.stage;
    const { error } = await supabase.from('opportunities').update({ stage: newStage }).eq('id', opp.id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
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
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const updates = {
      expected_value: Number(editForm.expected_value) || opp.expected_value,
      close_date: editForm.close_date || opp.close_date,
      notes: editForm.notes,
    };
    const { error } = await supabase.from('opportunities').update(updates).eq('id', opp.id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    setOpp(prev => prev ? { ...prev, ...updates } : prev);
    setEditOpen(false);
    toast.success('บันทึกแล้ว');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const note: OpportunityNote = {
      id: `note-${Date.now()}`, opportunity_id: opp.id, account_id: opp.account_id,
      content: noteInput.trim(), created_by: currentUser?.name || 'Unknown', created_at: new Date().toISOString(),
    };
    addNoteGlobal(note);
    setNoteInput('');
    forceUpdate(n => n + 1);
    toast.success('บันทึกโน้ตแล้ว');
  };

  const handleActivityCreated = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const handleMarkDone = (actId: string) => {
    setActivities(prev => prev.map(a => a.id === actId ? { ...a, is_done: true } : a));
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    const { data, error } = await supabase.from('contacts').insert({
      account_id: opp.account_id, name: newContact.name.trim(),
      role: newContact.role || null, phone: newContact.phone || null,
    }).select().single();
    if (error) { toast.error('เพิ่มไม่สำเร็จ'); return; }
    setContacts(prev => [...prev, data as unknown as Contact]);
    setNewContact({ name: '', role: '', phone: '' });
    setAddContactOpen(false);
    toast.success('เพิ่มผู้ติดต่อแล้ว');
  };

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto space-y-4">
      {/* Top bar */}
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

      {/* Stage Path */}
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

      {/* 2-Column Layout: Left 30% / Right 70% */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* LEFT COLUMN: Deal Info + Stakeholders */}
        <div className="lg:col-span-3 space-y-4">
          {/* Deal Info */}
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Info</p>
              <button onClick={openEdit} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={12} />
              </button>
            </div>
            <InfoRow label="สินค้า" value={(opp.interested_products || []).join(', ') || '-'} />
            <InfoRow label="มูลค่า" value={`฿${(opp.expected_value || 0).toLocaleString()}`} highlight />
            <InfoRow label="Weighted" value={`฿${weighted.toLocaleString()}`} />

            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] text-muted-foreground shrink-0">ผู้ตัดสินใจ</span>
              <div className="text-right">
                {authorityContact ? (
                  <>
                    <span className="text-xs text-foreground font-medium">{authorityContact.name}</span>
                    {authorityContact.phone && <p className="text-[10px] text-muted-foreground">📞 {authorityContact.phone}</p>}
                  </>
                ) : <span className="text-xs text-muted-foreground">-</span>}
              </div>
            </div>

            <InfoRow label="งบประมาณ" value={opp.budget_range || '-'} />
            <InfoRow label="ช่องทางชำระ" value={opp.payment_method ? (PAYMENT_LABELS[opp.payment_method] || opp.payment_method) : '-'} />

            <div>
              <span className="text-[11px] text-muted-foreground">คู่แข่ง</span>
              {competitorTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {competitorTags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">{t}</span>)}
                </div>
              ) : <p className="text-xs text-muted-foreground mt-0.5">-</p>}
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground">เครื่องปัจจุบัน</span>
              {deviceTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {deviceTags.map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">{t}</span>)}
                </div>
              ) : <p className="text-xs text-muted-foreground mt-0.5">-</p>}
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] text-muted-foreground shrink-0">วันปิด</span>
              <div className="text-right">
                <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-foreground'}`}>{opp.close_date || '-'}</span>
                {closeDateDays !== null && (
                  <p className={`text-[10px] font-medium ${closeDateDays >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {closeDateDays >= 0 ? `อีก ${closeDateDays} วัน` : `เลยกำหนด ${Math.abs(closeDateDays)} วัน`}
                  </p>
                )}
              </div>
            </div>

            <InfoRow label="หมายเหตุ" value={opp.notes || '-'} />

            {isStuck && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-destructive font-medium mb-1">เหตุผลที่ค้าง</p>
                <Select
                  value={opp.stuck_reason || ''}
                  onValueChange={(val) => setOpp(prev => prev ? { ...prev, stuck_reason: val } : prev)}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="เลือกเหตุผล..." /></SelectTrigger>
                  <SelectContent>
                    {STUCK_REASONS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Stakeholders (Collapsible) */}
          <Collapsible open={stakeholdersOpen} onOpenChange={setStakeholdersOpen}>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ผู้มีอำนาจตัดสินใจ ({contacts.length})</p>
                  {stakeholdersOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.name}
                        {opp.authority_contact_id === c.id && <span className="ml-1 text-[9px] text-primary font-bold">⭐ ผู้ตัดสินใจ</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{c.role || '-'}</p>
                    </div>
                    {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                  </div>
                ))}
                {contacts.length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">ไม่มีผู้ติดต่อ</p>}
                <Button variant="outline" size="sm" className="w-full text-xs gap-1 h-7 mt-1" onClick={() => setAddContactOpen(true)}>
                  <Plus size={12} /> เพิ่มผู้ติดต่อ
                </Button>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>

        {/* RIGHT COLUMN: Activity Form + Focus + Notes input + History + Calendar */}
        <div className="lg:col-span-7 space-y-4">
          {/* Activity Creation Form */}
          <ActivityForm opportunityId={opp.id} accountId={opp.account_id} onActivityCreated={handleActivityCreated} />

          {/* Focus Panel (pending activities) */}
          <FocusPanel activities={activities} onMarkDone={handleMarkDone} />

          {/* Quick Note Input */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex gap-2">
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
          </div>

          {/* History Timeline */}
          <HistoryTimeline activities={activities} stageHistory={stageHistory} notes={notes} />

          {/* Calendar Panel */}
          <CalendarPanel activities={activities} />
        </div>
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
          <DialogHeader><DialogTitle className="text-sm">แก้ไขข้อมูลดีล</DialogTitle></DialogHeader>
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

      {/* Add Contact Dialog */}
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">เพิ่มผู้ติดต่อ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">ชื่อ *</label>
              <Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ตำแหน่ง</label>
              <Input value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">เบอร์โทร</label>
              <Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddContactOpen(false)}>ยกเลิก</Button>
            <Button size="sm" onClick={handleAddContact}>เพิ่ม</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right ${highlight ? 'font-bold text-foreground' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

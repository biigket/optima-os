import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ArrowLeft, Building2, ExternalLink, Users, Calendar, Clock,
  Phone, Eye, Presentation, FileCheck, AlertTriangle, DollarSign
} from 'lucide-react';
import { mockOpportunities, getAccountById, mockContacts } from '@/data/mockData';
import type { OpportunityStage } from '@/types';

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

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const opp = mockOpportunities.find(o => o.id === id);
  if (!opp) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">ไม่พบโอกาสขาย</p>
        <Button variant="outline" onClick={() => navigate('/opportunities')}><ArrowLeft size={14} className="mr-1" /> กลับ</Button>
      </div>
    );
  }

  const account = getAccountById(opp.account_id);
  const contacts = mockContacts.filter(c => c.account_id === opp.account_id);
  const stageIdx = STAGES.indexOf(opp.stage);
  const daysInStage = Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
  const isStuck = daysInStage > 14 && !['WON', 'LOST'].includes(opp.stage);
  const prob = PROBABILITY[opp.stage] || 0;
  const weighted = Math.round((opp.expected_value || 0) * prob / 100);
  const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !['WON', 'LOST'].includes(opp.stage);
  const ActivityIcon = opp.next_activity_type ? (ACTIVITY_ICONS[opp.next_activity_type] || Calendar) : Calendar;

  return (
    <div className="animate-fade-in max-w-[960px] mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="gap-1 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft size={16} /> กลับ Pipeline
      </Button>

      {/* === Customer Header === */}
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

      {/* === Stage Path (Salesforce-style) === */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex gap-0 overflow-x-auto">
          {STAGES.map((s, i) => {
            const isCurrent = s === opp.stage;
            const isPast = i < stageIdx;
            const isLost = opp.stage === 'LOST';
            return (
              <div key={s} className="flex-1 min-w-[90px]">
                <div className={`h-9 flex items-center justify-center text-[10px] font-semibold relative
                  ${isCurrent ? (isLost ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground') :
                    isPast ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}
                  ${i === 0 ? 'rounded-l-lg' : ''} ${i === STAGES.length - 1 ? 'rounded-r-lg' : ''}
                `}>
                  {STAGE_LABELS[s]}
                </div>
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

      {/* === Cockpit: 3-column grid === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deal Info */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Info</p>
          <InfoRow label="ประเภท" value={opp.opportunity_type === 'DEVICE' ? 'เครื่องมือ' : opp.opportunity_type === 'CONSUMABLE' ? 'สิ้นเปลือง' : '-'} />
          <InfoRow label="สินค้า" value={(opp.interested_products || []).join(', ') || '-'} />
          <InfoRow label="มูลค่า" value={`฿${(opp.expected_value || 0).toLocaleString()}`} highlight />
          <InfoRow label="Weighted" value={`฿${weighted.toLocaleString()}`} />
          {opp.quantity && <InfoRow label="จำนวน" value={`${opp.quantity}`} />}
          <InfoRow label="วันปิด" value={opp.close_date || '-'} warn={!!isOverdue} />
          <InfoRow label="หมายเหตุ" value={opp.notes || '-'} />
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

          {/* Quick action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8"><Phone size={11} /> โทร</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8"><Eye size={11} /> นัดเยี่ยม</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8"><Presentation size={11} /> นัด Demo</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1 h-8"><FileCheck size={11} /> ส่ง Proposal</Button>
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
              {c.phone && (
                <span className="text-[10px] text-muted-foreground">{c.phone}</span>
              )}
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">ไม่มีผู้ติดต่อ</p>
          )}
        </div>
      </div>

      {/* === Activity Timeline (placeholder) === */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Activity Timeline</p>
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
          กิจกรรมจะแสดงที่นี่เมื่อเชื่อมต่อฐานข้อมูล
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[60%] ${warn ? 'text-destructive' : highlight ? 'text-foreground text-sm' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { ArrowLeft, Building2, ExternalLink, Users, Calendar, DollarSign } from 'lucide-react';
import { mockOpportunities, getAccountById, mockContacts } from '@/data/mockData';
import type { OpportunityStage } from '@/types';

const STAGES: OpportunityStage[] = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'ใหม่', CONTACTED: 'ติดต่อแล้ว', DEMO_SCHEDULED: 'นัดสาธิต',
  DEMO_DONE: 'สาธิตแล้ว', NEGOTIATION: 'เจรจา', WON: 'ปิดได้', LOST: 'ปิดไม่ได้',
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

  return (
    <div className="animate-fade-in max-w-[900px] mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/opportunities')} className="gap-1 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft size={16} /> กลับโอกาสขาย
      </Button>

      {/* Customer Header */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Building2 size={16} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">{account?.clinic_name || '-'}</h1>
          {account && <StatusBadge status={account.customer_status} />}
          <button onClick={() => navigate(`/leads/${opp.account_id}`)} className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto">
            <ExternalLink size={11} /> ดูรายละเอียดลูกค้า
          </button>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>🧑‍💼 {opp.assigned_sale || '-'}</span>
          <span className="flex items-center gap-1"><Users size={10} /> {contacts.length} ผู้ติดต่อ</span>
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground mb-3">ขั้นตอน</p>
        <div className="flex gap-1">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1 space-y-1">
              <div className={`h-1.5 rounded-full ${i <= stageIdx ? (opp.stage === 'LOST' ? 'bg-destructive' : 'bg-primary') : 'bg-muted'}`} />
              <p className={`text-[10px] text-center ${s === opp.stage ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {STAGE_LABELS[s]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-medium text-muted-foreground">รายละเอียด</p>
          <InfoRow label="ประเภท" value={opp.opportunity_type === 'DEVICE' ? 'เครื่องมือ' : opp.opportunity_type === 'CONSUMABLE' ? 'สิ้นเปลือง' : '-'} />
          <InfoRow label="สินค้า" value={(opp.interested_products || []).join(', ') || '-'} />
          <InfoRow label="มูลค่า" value={`฿${(opp.expected_value || 0).toLocaleString()}`} />
          {opp.quantity && <InfoRow label="จำนวน" value={`${opp.quantity}`} />}
          <InfoRow label="วันปิด" value={opp.close_date || '-'} />
          <InfoRow label="หมายเหตุ" value={opp.notes || '-'} />
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <p className="text-xs font-medium text-muted-foreground">กิจกรรมถัดไป</p>
          {opp.next_activity_type ? (
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-sm font-medium text-foreground">{opp.next_activity_type}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={11} /> {opp.next_activity_date}</p>
            </div>
          ) : (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-700">
              ⚠️ ไม่มีกิจกรรมถัดไป
            </div>
          )}

          <p className="text-xs font-medium text-muted-foreground mt-4">ผู้ติดต่อ</p>
          {contacts.map(c => (
            <div key={c.id} className="text-xs text-foreground p-2 rounded bg-muted/30">
              <span className="font-medium">{c.name}</span>
              {c.role && <span className="text-muted-foreground ml-1">({c.role})</span>}
            </div>
          ))}
          {contacts.length === 0 && <p className="text-xs text-muted-foreground">ไม่มีผู้ติดต่อ</p>}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

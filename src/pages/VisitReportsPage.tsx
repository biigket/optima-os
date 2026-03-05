import { FileText, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAccounts, getUserById } from '@/data/mockData';

const mockReports = [
  { id: 'vr1', accountId: 'a1', userId: 'u2', date: '2026-03-05', subject: 'ติดตามผลการใช้งานเครื่อง PicoStar', summary: 'ลูกค้าพึงพอใจกับผลลัพธ์ ต้องการสั่งวัสดุสิ้นเปลืองเพิ่ม', outcome: 'FOLLOW_UP' },
  { id: 'vr2', accountId: 'a2', userId: 'u2', date: '2026-03-04', subject: 'นำเสนอ HydraGlow Facial System', summary: 'ลูกค้าสนใจ ขอนัดสาธิตสัปดาห์หน้า', outcome: 'DEMO_SCHEDULED' },
  { id: 'vr3', accountId: 'a3', userId: 'u2', date: '2026-03-02', subject: 'เข้าพบครั้งแรก', summary: 'คลินิกเปิดใหม่ สนใจเครื่อง laser หลายรุ่น', outcome: 'NEW' },
];

const outcomeLabels: Record<string, string> = {
  FOLLOW_UP: 'ติดตาม', DEMO_SCHEDULED: 'นัดสาธิต', NEW: 'ลีดใหม่'
};

export default function VisitReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">รายงานเยี่ยมลูกค้า</h1>
          <p className="text-sm text-muted-foreground">สรุปผลการเข้าเยี่ยมลูกค้า</p>
        </div>
        <Button size="sm" className="gap-1.5"><FileText size={14} /> สร้างรายงาน</Button>
      </div>

      <div className="space-y-3">
        {mockReports.map(report => {
          const account = mockAccounts.find(a => a.accountId === report.accountId);
          const user = getUserById(report.userId);
          return (
            <div key={report.id} className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{report.subject}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Building2 size={12} /> {account?.clinicName}</span>
                    <span className="flex items-center gap-1"><User size={12} /> {user?.name}</span>
                    <span>{new Date(report.date).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <StatusBadge status={report.outcome} />
              </div>
              <p className="text-sm text-muted-foreground">{report.summary}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

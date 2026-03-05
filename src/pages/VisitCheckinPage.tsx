import { MapPin, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAccounts } from '@/data/mockData';

const mockCheckins = [
  { id: 'vc1', accountId: 'a1', checkinTime: '2026-03-05T09:30:00', location: '13.7563, 100.5018', note: 'พบลูกค้าเพื่อติดตามสินค้า', userId: 'u2' },
  { id: 'vc2', accountId: 'a2', checkinTime: '2026-03-04T14:00:00', location: '18.7883, 98.9853', note: 'เข้าพบเพื่อนำเสนอสินค้าใหม่', userId: 'u2' },
  { id: 'vc3', accountId: 'a4', checkinTime: '2026-03-03T11:00:00', location: '13.7563, 100.5018', note: 'ตรวจเช็คเครื่องหลังติดตั้ง', userId: 'u2' },
];

export default function VisitCheckinPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">เช็คอินเยี่ยมลูกค้า</h1>
          <p className="text-sm text-muted-foreground">บันทึกการเข้าเยี่ยมลูกค้า</p>
        </div>
        <Button size="sm" className="gap-1.5"><MapPin size={14} /> เช็คอิน</Button>
      </div>

      <div className="space-y-3">
        {mockCheckins.map(ci => {
          const account = mockAccounts.find(a => a.accountId === ci.accountId);
          return (
            <div key={ci.id} className="rounded-lg border bg-card p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{account?.clinicName}</p>
                </div>
                <p className="text-sm text-muted-foreground">{ci.note}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{new Date(ci.checkinTime).toLocaleString('th-TH')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

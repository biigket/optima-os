import { Presentation, Calendar, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockWorkItems, getAccountById, getUserById } from '@/data/mockData';

export default function DemosPage() {
  const demos = mockWorkItems.filter(w => w.type === 'DEMO_EVENT' || w.type === 'DEMO_PREP');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">สาธิตสินค้า</h1>
          <p className="text-sm text-muted-foreground">การสาธิตทั้งหมด {demos.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5"><Presentation size={14} /> นัดสาธิตใหม่</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {demos.map(demo => {
          const account = getAccountById(demo.linkedAccountId);
          const assignee = getUserById(demo.assigneeUserId);
          return (
            <div key={demo.workItemId} className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Presentation size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{demo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={demo.status} />
                      <StatusBadge status={demo.priority} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 size={12} />
                  <span>{account?.clinic_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{new Date(demo.dueDateTime).toLocaleString('th-TH')}</span>
                </div>
                {demo.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{demo.location}</span>
                  </div>
                )}
                <p>ผู้รับผิดชอบ: {assignee?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

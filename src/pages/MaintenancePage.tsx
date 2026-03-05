import { Wrench, Building2, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockWorkItems, getAccountById, getUserById } from '@/data/mockData';

export default function MaintenancePage() {
  const tickets = mockWorkItems.filter(w => w.type === 'SERVICE_TICKET' || w.type === 'INSTALLATION');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ซ่อมบำรุง</h1>
          <p className="text-sm text-muted-foreground">งานซ่อมบำรุงและติดตั้ง {tickets.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5"><Wrench size={14} /> เปิดใบแจ้งซ่อม</Button>
      </div>

      <div className="space-y-3">
        {tickets.map(ticket => {
          const account = getAccountById(ticket.linkedAccountId);
          const assignee = getUserById(ticket.assigneeUserId);
          return (
            <div key={ticket.workItemId} className="rounded-lg border bg-card p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive shrink-0">
                <Wrench size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ticket.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={ticket.status} />
                      <StatusBadge status={ticket.priority} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Building2 size={12} /> {account?.clinic_name}</span>
                  <span className="flex items-center gap-1"><User size={12} /> {assignee?.name}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ticket.dueDateTime).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import StatusBadge from '@/components/ui/StatusBadge';
import { mockWorkItems, getAccountById, getUserById } from '@/data/mockData';
import { Wrench } from 'lucide-react';

export default function ServicePage() {
  const serviceItems = mockWorkItems.filter(w => w.departmentOwner === 'SERVICE');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service</h1>
        <p className="text-sm text-muted-foreground">Installation, repair, and service tickets</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Technician</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
            </tr>
          </thead>
          <tbody>
            {serviceItems.map(item => {
              const account = getAccountById(item.linkedAccountId);
              const tech = getUserById(item.assigneeUserId);
              return (
                <tr key={item.workItemId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-2 font-medium text-foreground">
                    <Wrench size={16} className="text-muted-foreground" />
                    {item.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{item.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account?.clinicName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tech?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(item.dueDateTime).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

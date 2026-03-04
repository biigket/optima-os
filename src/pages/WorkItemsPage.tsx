import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockWorkItems, getAccountById, getUserById } from '@/data/mockData';
import type { Department } from '@/types';

const departments: (Department | 'ALL')[] = ['ALL', 'SALES', 'PRODUCT', 'SERVICE', 'STOCK', 'FINANCE', 'MARKETING'];

export default function WorkItemsPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department | 'ALL'>('ALL');

  const filtered = mockWorkItems.filter(w => {
    const matchSearch = w.title.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'ALL' || w.departmentOwner === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Work Items</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} items</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search work items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {departments.map(dept => (
            <Button
              key={dept}
              size="sm"
              variant={deptFilter === dept ? 'default' : 'outline'}
              onClick={() => setDeptFilter(dept)}
              className="text-xs"
            >
              {dept}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Department</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const account = getAccountById(item.linkedAccountId);
              const assignee = getUserById(item.assigneeUserId);
              return (
                <tr key={item.workItemId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{item.type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.departmentOwner} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{account?.clinicName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{assignee?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(item.dueDateTime).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

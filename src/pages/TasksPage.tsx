import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockWorkItems, getAccountById, getUserById } from '@/data/mockData';

type WorkItemStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED';

const statuses: (WorkItemStatus | 'ALL')[] = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING', 'DONE', 'CANCELLED'];
const statusLabels: Record<string, string> = {
  ALL: 'ทั้งหมด', OPEN: 'เปิด', IN_PROGRESS: 'กำลังดำเนินการ', WAITING: 'รอดำเนินการ', DONE: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก'
};
const typeLabels: Record<string, string> = {
  CONTACT: 'ติดต่อ', FOLLOW_UP: 'ติดตาม', DEMO_PREP: 'เตรียมสาธิต', DEMO_EVENT: 'สาธิต',
  SERVICE_PREP: 'เตรียมบริการ', SHIPMENT: 'จัดส่ง', INSTALLATION: 'ติดตั้ง', SERVICE_TICKET: 'ซ่อมบำรุง',
  FINANCE_DOC: 'เอกสารการเงิน', CONSUMABLE_ORDER: 'สั่งวัสดุ', MARKETING_TASK: 'การตลาด'
};

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkItemStatus | 'ALL'>('ALL');

  const filtered = mockWorkItems.filter(w => {
    const matchSearch = w.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">งาน</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} รายการ</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหางาน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statuses.map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {statusLabels[s]}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่องาน</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ผู้รับผิดชอบ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ความสำคัญ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">สถานะ</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">กำหนดเสร็จ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const account = getAccountById(item.linkedAccountId);
              const assignee = getUserById(item.assigneeUserId);
              return (
                <tr key={item.workItemId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{typeLabels[item.type] || item.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{account?.clinic_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{assignee?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(item.dueDateTime).toLocaleDateString('th-TH')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

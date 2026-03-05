import { useState } from 'react';
import { Search, Plus, Building2, MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAccounts, mockContacts, getUserById } from '@/data/mockData';

export default function LeadsPage() {
  const [search, setSearch] = useState('');

  const leads = mockAccounts.filter(a => {
    const matchSearch = a.clinicName.toLowerCase().includes(search.toLowerCase()) ||
      a.province.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ลีด</h1>
          <p className="text-sm text-muted-foreground">ลูกค้าและผู้มุ่งหวังทั้งหมด {leads.length} ราย</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> เพิ่มลีดใหม่</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="ค้นหาลีด..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leads.map(account => {
          const contacts = mockContacts.filter(c => c.accountId === account.accountId);
          const owner = getUserById(account.assignedSalesOwnerUserId);
          return (
            <div key={account.accountId} className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{account.clinicName}</p>
                    <StatusBadge status={account.customerStatus} />
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  <span>{account.address}, {account.province}</span>
                </div>
                {contacts[0] && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} />
                    <span>{contacts[0].name} — {contacts[0].phone}</span>
                  </div>
                )}
                <p>เจ้าของ: {owner?.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

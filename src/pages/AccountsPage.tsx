import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockAccounts, getContactsForAccount, getOpportunitiesForAccount, getUserById } from '@/data/mockData';

export default function AccountsPage() {
  const [search, setSearch] = useState('');
  const filtered = mockAccounts.filter(a =>
    a.clinicName.toLowerCase().includes(search.toLowerCase()) ||
    a.province.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">{mockAccounts.length} total accounts</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> Add Account</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clinic Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Province</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contacts</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Opportunities</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sales Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(account => {
              const contacts = getContactsForAccount(account.accountId);
              const opps = getOpportunitiesForAccount(account.accountId);
              const owner = getUserById(account.assignedSalesOwnerUserId);
              return (
                <tr key={account.accountId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/accounts/${account.accountId}`} className="flex items-center gap-2 font-medium text-foreground hover:text-accent transition-colors">
                      <Building2 size={16} className="text-muted-foreground" />
                      {account.clinicName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{account.province}</td>
                  <td className="px-4 py-3"><StatusBadge status={account.customerStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{contacts.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{opps.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{owner?.name || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

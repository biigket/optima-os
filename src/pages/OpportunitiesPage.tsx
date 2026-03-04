import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockOpportunities, getAccountById, getUserById } from '@/data/mockData';

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const filtered = mockOpportunities.filter(o => {
    const account = getAccountById(o.accountId);
    return account?.clinicName.toLowerCase().includes(search.toLowerCase()) ||
      o.opportunityType.toLowerCase().includes(search.toLowerCase());
  });

  const totalValue = filtered.reduce((sum, o) => sum + o.expectedValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} opportunities · ฿{totalValue.toLocaleString()} pipeline</p>
        </div>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> New Opportunity</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Expected Value</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Close Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(opp => {
              const account = getAccountById(opp.accountId);
              const owner = getUserById(opp.ownerUserId);
              return (
                <tr key={opp.opportunityId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/accounts/${opp.accountId}`} className="flex items-center gap-2 font-medium text-foreground hover:text-accent">
                      <Target size={16} className="text-muted-foreground" />
                      {account?.clinicName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{opp.opportunityType.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={opp.stage} /></td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">฿{opp.expectedValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{opp.closeDate}</td>
                  <td className="px-4 py-3 text-muted-foreground">{owner?.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

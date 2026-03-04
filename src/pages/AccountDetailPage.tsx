import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Phone, Mail, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { getAccountById, getContactsForAccount, getOpportunitiesForAccount, getWorkItemsForAccount, getActivitiesForAccount, getUserById } from '@/data/mockData';

export default function AccountDetailPage() {
  const { accountId } = useParams();
  const account = getAccountById(accountId || '');
  const contacts = getContactsForAccount(accountId || '');
  const opportunities = getOpportunitiesForAccount(accountId || '');
  const workItems = getWorkItemsForAccount(accountId || '');
  const activities = getActivitiesForAccount(accountId || '');

  if (!account) return <div className="p-6 text-muted-foreground">Account not found</div>;

  const owner = getUserById(account.assignedSalesOwnerUserId);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/accounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Back to Accounts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{account.clinicName}</h1>
            <p className="text-sm text-muted-foreground">{account.address}, {account.province}</p>
          </div>
        </div>
        <StatusBadge status={account.customerStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col: Details + Contacts */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <div className="text-sm space-y-2">
              <div><span className="text-muted-foreground">Sales Owner:</span> <span className="font-medium">{owner?.name}</span></div>
              <div><span className="text-muted-foreground">Province:</span> <span className="font-medium">{account.province}</span></div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Contacts ({contacts.length})</h3>
            {contacts.map(c => (
              <div key={c.contactId} className="border rounded-md p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c.phone && <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail size={12} />{c.email}</span>}
                  {c.lineId && <span className="flex items-center gap-1"><MessageCircle size={12} />{c.lineId}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right col: Opportunities, Work Items, Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Opportunities */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Opportunities ({opportunities.length})</h3>
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No opportunities yet</p>
            ) : (
              <div className="space-y-2">
                {opportunities.map(opp => (
                  <Link to={`/opportunities/${opp.opportunityId}`} key={opp.opportunityId} className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{opp.opportunityType.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">฿{opp.expectedValue.toLocaleString()} · Close: {opp.closeDate}</p>
                    </div>
                    <StatusBadge status={opp.stage} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Work Items */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Work Items ({workItems.length})</h3>
            <div className="space-y-2">
              {workItems.slice(0, 5).map(item => (
                <div key={item.workItemId} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.departmentOwner} · Due: {new Date(item.dueDateTime).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={item.priority} />
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Activity Timeline</h3>
            <div className="space-y-3">
              {activities.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()).map(activity => {
                const user = getUserById(activity.performedByUserId);
                return (
                  <div key={activity.activityId} className="flex gap-3 text-sm">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{user?.name} · {new Date(activity.performedAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
              {activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

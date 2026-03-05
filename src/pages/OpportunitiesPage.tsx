import { useState } from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import OpportunityKanban from '@/components/opportunities/OpportunityKanban';
import CustomerSelectModal from '@/components/opportunities/CustomerSelectModal';
import CreateOpportunityForm from '@/components/opportunities/CreateOpportunityForm';
import { mockOpportunities, getAccountById } from '@/data/mockData';
import { toast } from 'sonner';
import type { Account, Opportunity, OpportunityStage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const stages: (OpportunityStage | 'ALL')[] = ['ALL', 'NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const stageLabels: Record<string, string> = {
  ALL: 'ทั้งหมด', NEW_LEAD: 'ใหม่', CONTACTED: 'ติดต่อแล้ว', DEMO_SCHEDULED: 'นัดสาธิต',
  DEMO_DONE: 'สาธิตแล้ว', NEGOTIATION: 'เจรจา', WON: 'ปิดได้', LOST: 'ปิดไม่ได้'
};

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Creation flow state
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [noContactWarning, setNoContactWarning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);

  const filtered = opportunities.filter(o => {
    const account = getAccountById(o.account_id);
    const matchSearch = !search || account?.clinic_name.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || o.stage === stageFilter;
    const matchType = typeFilter === 'ALL' || o.opportunity_type === typeFilter;
    return matchSearch && matchStage && matchType;
  });

  const totalValue = filtered.reduce((sum, o) => sum + (o.expected_value || 0), 0);

  const handleCustomerSelect = (account: Account, hasContacts: boolean) => {
    setSelectModalOpen(false);
    setSelectedCustomer(account);
    if (!hasContacts) {
      setNoContactWarning(true);
    } else {
      setCreateFormOpen(true);
    }
  };

  const handleSave = (data: Opportunity) => {
    setOpportunities(prev => [...prev, data]);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">โอกาสขาย</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} รายการ · มูลค่ารวม ฿{totalValue.toLocaleString()}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setSelectModalOpen(true)}>
          <Plus size={14} /> เพิ่มโอกาสขาย
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาโอกาสขาย..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Type filter */}
        <div className="flex gap-1">
          {['ALL', 'DEVICE', 'CONSUMABLE'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {t === 'ALL' ? 'ทั้งหมด' : t === 'DEVICE' ? 'เครื่อง' : 'สิ้นเปลือง'}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-0.5 bg-muted rounded-md p-0.5 ml-auto">
          <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Stage pills (table view only) */}
      {viewMode === 'table' && (
        <div className="flex gap-1 flex-wrap">
          {stages.map(s => (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${stageFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {stageLabels[s]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {viewMode === 'kanban' ? (
        <OpportunityKanban opportunities={filtered} typeFilter={typeFilter} />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">เจ้าของ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">มูลค่า (฿)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">วันปิด</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(opp => {
                const account = getAccountById(opp.account_id);
                return (
                  <tr key={opp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/opportunities/${opp.id}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{account?.clinic_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{opp.opportunity_type === 'DEVICE' ? 'เครื่อง' : opp.opportunity_type === 'CONSUMABLE' ? 'สิ้นเปลือง' : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={opp.stage} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{opp.assigned_sale}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">฿{(opp.expected_value || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{opp.close_date ? new Date(opp.close_date).toLocaleDateString('th-TH') : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Select Modal */}
      <CustomerSelectModal
        open={selectModalOpen}
        onOpenChange={setSelectModalOpen}
        onSelect={handleCustomerSelect}
      />

      {/* Create Opportunity Form */}
      {selectedCustomer && (
        <CreateOpportunityForm
          open={createFormOpen}
          onOpenChange={setCreateFormOpen}
          customer={selectedCustomer}
          onSave={handleSave}
        />
      )}

      {/* No Contact Warning */}
      <Dialog open={noContactWarning} onOpenChange={setNoContactWarning}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">⚠️ กรุณาเพิ่มผู้ติดต่อ</DialogTitle>
            <DialogDescription className="text-xs">
              ลูกค้า "{selectedCustomer?.clinic_name}" ยังไม่มีผู้ติดต่อในระบบ กรุณาเพิ่มผู้ติดต่อก่อนสร้างโอกาสขาย
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setNoContactWarning(false)}>ปิด</Button>
            <Button size="sm" onClick={() => {
              setNoContactWarning(false);
              if (selectedCustomer) window.location.href = `/leads/${selectedCustomer.id}`;
            }}>ไปหน้าลูกค้า</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

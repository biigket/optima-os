import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, LayoutGrid, List, ArrowUpDown, Calendar, Building2, Clock, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/ui/StatusBadge';
import OpportunityKanban from '@/components/opportunities/OpportunityKanban';
import CustomerSelectModal from '@/components/opportunities/CustomerSelectModal';
import CreateOpportunityForm from '@/components/opportunities/CreateOpportunityForm';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth, MOCK_SALES } from '@/hooks/useMockAuth';
import { toast } from 'sonner';
import type { Account, Opportunity, OpportunityStage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const stages: (OpportunityStage | 'ALL')[] = ['ALL', 'NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'WON', 'LOST'];
const stageLabels: Record<string, string> = {
  ALL: 'ทั้งหมด', NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/Need', DEMO_SCHEDULED: 'Demo',
  DEMO_DONE: 'Proposal', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost'
};

const PROBABILITY: Record<string, number> = {
  NEW_LEAD: 10, CONTACTED: 20, DEMO_SCHEDULED: 40, DEMO_DONE: 60, NEGOTIATION: 80, WON: 100, LOST: 0,
};

type SortKey = 'next_activity' | 'value' | 'close_date' | 'days_in_stage';

// Internal notes store (shared across app via export)
export interface OpportunityNote {
  id: string;
  opportunity_id: string;
  account_id: string;
  content: string;
  created_by: string;
  created_at: string;
  parent_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

let globalNotes: OpportunityNote[] = [];
export function getNotesForOpportunity(oppId: string) { return globalNotes.filter(n => n.opportunity_id === oppId); }
export function getNotesForAccount(accountId: string) { return globalNotes.filter(n => n.account_id === accountId); }
export function addNoteGlobal(note: OpportunityNote) { globalNotes = [note, ...globalNotes]; }
export function deleteNoteGlobal(id: string) { globalNotes = globalNotes.filter(n => n.id !== id); }
export function updateNoteGlobal(id: string, content: string) { globalNotes = globalNotes.map(n => n.id === id ? { ...n, content } : n); }

// Account cache — populated on demand from DB
const accountCache: Record<string, { clinic_name: string; customer_status: string; assigned_sale?: string }> = {};
export function getCachedAccount(id: string) { return accountCache[id]; }

export default function OpportunitiesPage() {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const salesUsers = MOCK_SALES.filter(u => u.role === 'SALE');

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<OpportunityStage | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [saleFilter, setSaleFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [sortKey, setSortKey] = useState<SortKey>('next_activity');

  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [noContactWarning, setNoContactWarning] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [, forceUpdate] = useState(0);

  // Load opportunities + account cache from DB
  const fetchOpportunities = async () => {
    const [oppRes, accRes] = await Promise.all([
      supabase.from('opportunities').select('*').order('created_at', { ascending: false }),
      supabase.from('accounts').select('id, clinic_name, customer_status, assigned_sale'),
    ]);
    if (oppRes.data) setOpportunities(oppRes.data as unknown as Opportunity[]);
    if (accRes.data) {
      accRes.data.forEach((a: any) => {
        accountCache[a.id] = { clinic_name: a.clinic_name, customer_status: a.customer_status, assigned_sale: a.assigned_sale || undefined };
      });
    }
  };

  useEffect(() => { fetchOpportunities(); }, []);

  // Role-based filtering
  const roleFiltered = useMemo(() => {
    if (isAdmin) {
      if (saleFilter === 'ALL') return opportunities;
      return opportunities.filter(o => o.assigned_sale === saleFilter);
    }
    return opportunities.filter(o => o.assigned_sale === currentUser?.name);
  }, [opportunities, isAdmin, saleFilter, currentUser?.name]);

  const filtered = roleFiltered.filter(o => {
    const acc = accountCache[o.account_id];
    const matchSearch = !search || acc?.clinic_name.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || o.stage === stageFilter;
    const matchType = typeFilter === 'ALL' || o.opportunity_type === typeFilter;
    return matchSearch && matchStage && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'next_activity':
        if (!a.next_activity_date && !b.next_activity_date) return 0;
        if (!a.next_activity_date) return 1;
        if (!b.next_activity_date) return -1;
        return new Date(a.next_activity_date).getTime() - new Date(b.next_activity_date).getTime();
      case 'value':
        return (b.expected_value || 0) - (a.expected_value || 0);
      case 'close_date':
        if (!a.close_date && !b.close_date) return 0;
        if (!a.close_date) return 1;
        if (!b.close_date) return -1;
        return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
      case 'days_in_stage':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  const totalValue = filtered.reduce((sum, o) => sum + (o.expected_value || 0), 0);
  const totalWeighted = filtered.reduce((sum, o) => {
    const prob = o.probability ?? PROBABILITY[o.stage] ?? 0;
    return sum + Math.round((o.expected_value || 0) * prob / 100);
  }, 0);

  const handleCustomerSelect = (account: Account, hasContacts: boolean) => {
    setSelectModalOpen(false);
    setSelectedCustomer(account);
    // Cache account for display
    accountCache[account.id] = { clinic_name: account.clinic_name, customer_status: account.customer_status, assigned_sale: account.assigned_sale || undefined };
    if (!hasContacts) {
      setNoContactWarning(true);
    } else {
      setCreateFormOpen(true);
    }
  };

  const handleSave = async (data: Opportunity) => {
    const { id, quantity, stuck_reason, ...rest } = data;
    const insertPayload = {
      account_id: rest.account_id,
      stage: rest.stage,
      opportunity_type: rest.opportunity_type || null,
      interested_products: rest.interested_products || null,
      expected_value: rest.expected_value || null,
      assigned_sale: rest.assigned_sale || null,
      notes: rest.notes || null,
      close_date: rest.close_date || null,
      next_activity_type: rest.next_activity_type || null,
      next_activity_date: rest.next_activity_date || null,
      probability: rest.probability ?? 10,
      budget_range: rest.budget_range || null,
      payment_method: rest.payment_method || null,
      competitors: rest.competitors || null,
      current_devices: rest.current_devices || null,
      order_frequency: rest.order_frequency || null,
    };
    const { error } = await supabase.from('opportunities').insert(insertPayload);
    if (error) { toast.error('สร้างโอกาสขายไม่สำเร็จ'); return; }
    fetchOpportunities();
  };

  const handleStageChange = async (oppId: string, newStage: OpportunityStage) => {
    const { error } = await supabase.from('opportunities').update({ stage: newStage }).eq('id', oppId);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, stage: newStage } : o));
  };

  const handleUpdateOpportunity = async (oppId: string, updates: Partial<Opportunity>) => {
    const { error } = await supabase.from('opportunities').update(updates).eq('id', oppId);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    setOpportunities(prev => prev.map(o => o.id === oppId ? { ...o, ...updates } : o));
  };

  const handleAddNote = (oppId: string, content: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    if (!opp) return;
    const note: OpportunityNote = {
      id: `note-${Date.now()}`,
      opportunity_id: oppId,
      account_id: opp.account_id,
      content,
      created_by: currentUser?.name || 'Unknown',
      created_at: new Date().toISOString(),
    };
    addNoteGlobal(note);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{filtered.length} ดีล</span>
            <span className="text-muted-foreground/40">·</span>
            <span>รวม ฿{totalValue.toLocaleString()}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>Weighted ฿{totalWeighted.toLocaleString()}</span>
            {!isAdmin && currentUser && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-primary font-medium">{currentUser.name}</span>
              </>
            )}
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setSelectModalOpen(true)}>
          <Plus size={14} /> เพิ่มดีล
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาคลินิก..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

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

        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground" />
            <Select value={saleFilter} onValueChange={setSaleFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue placeholder="เซลล์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">เซลล์ทั้งหมด</SelectItem>
                {salesUsers.map(s => (
                  <SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="flex gap-1 items-center">
            <ArrowUpDown size={12} className="text-muted-foreground" />
            {([
              ['next_activity', 'กิจกรรมถัดไป'],
              ['value', 'มูลค่า'],
              ['close_date', 'วันปิด'],
              ['days_in_stage', 'วันในสถานะ'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${sortKey === key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-0.5 bg-muted rounded-md p-0.5 ml-auto">
          <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
            <List size={14} />
          </button>
        </div>
      </div>

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

      {viewMode === 'kanban' ? (
        <OpportunityKanban
          opportunities={filtered}
          typeFilter={typeFilter}
          onStageChange={handleStageChange}
          onUpdateOpportunity={handleUpdateOpportunity}
          onAddNote={handleAddNote}
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">สินค้า</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">กิจกรรมถัดไป</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">เจ้าของ</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">มูลค่า</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Weighted</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">วันปิด</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">วัน</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(opp => {
                const acc = accountCache[opp.account_id];
                const daysInStage = Math.floor((Date.now() - new Date(opp.created_at || Date.now()).getTime()) / 86400000);
                const isTerminal = ['WON', 'LOST'].includes(opp.stage);
                const isOverdue = opp.close_date && new Date(opp.close_date) < new Date() && !isTerminal;
                const prob = PROBABILITY[opp.stage] || 0;
                const weighted = Math.round((opp.expected_value || 0) * prob / 100);
                const daysColor = isTerminal ? 'text-muted-foreground' :
                  daysInStage >= 7 ? 'text-destructive' :
                  daysInStage >= 3 ? 'text-warning' :
                  'text-emerald-600';

                return (
                  <tr key={opp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground">{acc?.clinic_name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                      {(opp.interested_products || []).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={opp.stage} /></td>
                    <td className="px-4 py-3">
                      {opp.next_activity_type ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar size={10} className="text-muted-foreground" />
                          <span className="font-medium text-foreground">{opp.next_activity_type}</span>
                          <span className="text-muted-foreground">{opp.next_activity_date ? new Date(opp.next_activity_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-warning font-medium">⚠ ไม่มี</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{opp.assigned_sale}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">฿{(opp.expected_value || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">฿{weighted.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                      {opp.close_date ? new Date(opp.close_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${daysColor}`}>
                        <Clock size={10} className="inline mr-0.5" />
                        {daysInStage}d
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">ยังไม่มีดีล — กดปุ่ม "เพิ่มดีล" เพื่อเริ่มต้น</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CustomerSelectModal open={selectModalOpen} onOpenChange={setSelectModalOpen} onSelect={handleCustomerSelect} />

      {selectedCustomer && (
        <CreateOpportunityForm open={createFormOpen} onOpenChange={setCreateFormOpen} customer={selectedCustomer} onSave={handleSave} />
      )}

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
              if (selectedCustomer) navigate(`/leads/${selectedCustomer.id}`);
            }}>ไปหน้าลูกค้า</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

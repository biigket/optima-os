import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { Search, Plus, MapPin, Users, ChevronRight } from 'lucide-react';
import { mockAccounts, mockContacts } from '@/data/mockData';
import type { Account } from '@/types';

type StatusFilter = 'ALL' | 'NEW_LEAD' | 'PURCHASED' | 'DORMANT';

interface CustomerSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (account: Account, hasContacts: boolean) => void;
}

const filterLabels: Record<StatusFilter, string> = {
  ALL: 'ทั้งหมด',
  NEW_LEAD: 'Prospect',
  PURCHASED: 'Customer',
  DORMANT: 'Dormant',
};

export default function CustomerSelectModal({ open, onOpenChange, onSelect }: CustomerSelectModalProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const contactCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mockContacts.forEach(c => { counts[c.account_id] = (counts[c.account_id] || 0) + 1; });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    return mockAccounts.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.clinic_name.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' ||
        (statusFilter === 'NEW_LEAD' && !['PURCHASED', 'DORMANT'].includes(a.customer_status)) ||
        (statusFilter === 'PURCHASED' && a.customer_status === 'PURCHASED') ||
        (statusFilter === 'DORMANT' && a.customer_status === 'DORMANT');
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const handleSelect = (account: Account) => {
    onSelect(account, (contactCounts[account.id] || 0) > 0);
    setSearch('');
    setStatusFilter('ALL');
  };

  const handleCreateNew = () => {
    onOpenChange(false);
    navigate('/leads?action=create');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-base">เลือกลูกค้า</DialogTitle>
          <DialogDescription className="text-xs">ค้นหาและเลือกลูกค้าจากโมดูลลูกค้า เพื่อสร้างโอกาสขาย</DialogDescription>
        </DialogHeader>

        <div className="px-5 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อคลินิก, ที่อยู่..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(filterLabels) as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0">
          <div className="space-y-1.5 mt-2">
            {filtered.map(account => (
              <button
                key={account.id}
                onClick={() => handleSelect(account)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group border border-transparent hover:border-border"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{account.clinic_name}</span>
                    <StatusBadge status={account.customer_status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {account.address && <span className="flex items-center gap-1 truncate"><MapPin size={10} />{account.address}</span>}
                    <span className="flex items-center gap-1"><Users size={10} />{account.assigned_sale || '-'}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">ไม่พบลูกค้าที่ตรงกัน</p>
            )}
          </div>
        </div>

        <div className="border-t p-4">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full" onClick={handleCreateNew}>
            <Plus size={13} /> สร้างลูกค้าใหม่ (ไปโมดูลลูกค้า)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

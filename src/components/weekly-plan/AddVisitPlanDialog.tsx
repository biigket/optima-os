import { useState, useEffect, useMemo } from 'react';
import { Search, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Account {
  id: string;
  clinic_name: string;
  customer_status: string;
  address: string | null;
  phone: string | null;
}

interface AddVisitPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  startTime: string;
  endTime: string;
  onSuccess: () => void;
}

export default function AddVisitPlanDialog({
  open, onOpenChange, selectedDate, startTime, endTime, onSuccess
}: AddVisitPlanDialogProps) {
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAccounts();
      setSearch('');
      setSelectedAccount(null);
    }
  }, [open]);

  async function fetchAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from('accounts')
      .select('id, clinic_name, customer_status, address, phone')
      .order('clinic_name');
    if (data) setAccounts(data);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a =>
      a.clinic_name.toLowerCase().includes(q) ||
      a.address?.toLowerCase().includes(q) ||
      a.phone?.includes(q)
    );
  }, [accounts, search]);

  async function handleSave() {
    if (!selectedAccount) return;
    setSaving(true);
    const { error } = await supabase.from('visit_plans').insert({
      plan_date: format(selectedDate, 'yyyy-MM-dd'),
      account_id: selectedAccount.id,
      visit_type: 'EXISTING',
      start_time: startTime,
      end_time: endTime,
    });
    setSaving(false);
    if (error) return;
    onSuccess();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>เพิ่มแผนเยี่ยมลูกค้า</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: th })} · {startTime} – {endTime}
          </p>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Selected */}
          {selectedAccount && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 flex items-center gap-3">
              <Building2 size={18} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedAccount.clinic_name}</p>
                {selectedAccount.address && (
                  <p className="text-xs text-muted-foreground truncate">{selectedAccount.address}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">{selectedAccount.customer_status}</Badge>
            </div>
          )}

          {/* Account list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">กำลังโหลด...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">ไม่พบลูกค้า</p>
            ) : (
              filtered.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`w-full text-left rounded-lg border p-3 flex items-center gap-3 transition-colors ${
                    selectedAccount?.id === account.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <Building2 size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                    {account.address && (
                      <p className="text-xs text-muted-foreground truncate">{account.address}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <Button onClick={handleSave} disabled={!selectedAccount || saving} className="w-full">
            {saving ? 'กำลังบันทึก...' : 'เพิ่มแผนเยี่ยม'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

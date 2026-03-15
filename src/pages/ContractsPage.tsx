import { useState } from 'react';
import { FileText, Plus, Search, Building2, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';
import CreateContractWizard from '@/components/contracts/CreateContractWizard';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'แบบร่าง',
  SIGNED: 'เซ็นแล้ว',
  ACTIVE: 'มีผลบังคับ',
  COMPLETED: 'เสร็จสิ้น',
};

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (contracts || []).filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.contract_number?.toLowerCase().includes(s) ||
      c.buyer_company_name?.toLowerCase().includes(s) ||
      c.product_name?.toLowerCase().includes(s) ||
      c.qt_number?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">หนังสือสัญญาซื้อขาย</h1>
            <p className="text-sm text-muted-foreground">จัดการหนังสือสัญญาซื้อขายทั้งหมด</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          <Plus size={16} className="mr-1" />
          สร้างสัญญาใหม่
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสัญญา..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการสัญญาซื้อขาย ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">กำลังโหลด...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText size={48} className="mb-3 opacity-30" />
              <p className="text-sm">ยังไม่มีหนังสือสัญญาซื้อขาย</p>
              <p className="text-xs mt-1">กดปุ่ม "สร้างสัญญาใหม่" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{c.contract_number}</span>
                        <StatusBadge status={c.status || 'DRAFT'} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />
                          {c.buyer_company_name || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={12} />
                          {c.product_name || '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {c.contract_date ? format(new Date(c.contract_date), 'dd/MM/yyyy') : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {c.total_price?.toLocaleString()} บาท
                      </div>
                      <div className="text-xs text-muted-foreground">
                        QT: {c.qt_number || '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateContractWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={() => refetch()}
      />
    </div>
  );
}

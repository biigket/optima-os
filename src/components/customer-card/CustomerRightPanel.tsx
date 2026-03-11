import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Monitor, ShoppingCart, Wrench, Receipt, FolderOpen, Megaphone, ExternalLink, CreditCard
} from 'lucide-react';
import {
  getDevicesForAccount, getConsumablesForAccount, getServiceForAccount,
  getDocumentsForAccount, getMarketingForAccount,
} from '@/data/customerCardMockData';
import { supabase } from '@/integrations/supabase/client';
import StatusBadge from '@/components/ui/StatusBadge';

interface Props {
  accountId: string;
}

interface QuotationDoc {
  id: string;
  qt_number: string | null;
  qt_date: string | null;
  qt_attachment: string | null;
  product: string | null;
  price: number | null;
  approval_status: string | null;
  payment_status: string | null;
  payment_condition: string | null;
  sale_assigned: string | null;
  customer_signed_at: string | null;
  deposit_value: number | null;
  deposit_slip_status: string | null;
}

interface QuotationPurchase extends QuotationDoc {
  // same shape, used for purchases tab
}

function formatCurrency(val?: number | null) {
  if (!val) return '฿0';
  return `฿${val.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-muted text-muted-foreground',
  UNDER_REPAIR: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  JOINED: 'bg-blue-100 text-blue-700',
  INVITED: 'bg-amber-100 text-amber-700',
};

const DOC_ICONS: Record<string, string> = {
  CONTRACT: '📄', QUOTATION: '📋', INVOICE: '🧾', PM_REPORT: '🔧', CERTIFICATE: '🏆',
};

export default function CustomerRightPanel({ accountId }: Props) {
  const navigate = useNavigate();
  const devices = getDevicesForAccount(accountId);
  const consumables = getConsumablesForAccount(accountId);
  const services = getServiceForAccount(accountId);
  const documents = getDocumentsForAccount(accountId);
  const marketing = getMarketingForAccount(accountId);

  const [qtDocs, setQtDocs] = useState<QuotationDoc[]>([]);
  const [purchases, setPurchases] = useState<QuotationPurchase[]>([]);
  const [paidRevenue, setPaidRevenue] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      // Fetch approved quotations for documents tab
      const { data: docs } = await supabase
        .from('quotations')
        .select('id, qt_number, qt_date, qt_attachment, product, price, approval_status, payment_status, payment_condition, sale_assigned, customer_signed_at')
        .eq('account_id', accountId)
        .in('approval_status', ['APPROVED', 'CUSTOMER_SIGNED'])
        .not('qt_attachment', 'is', null)
        .order('qt_date', { ascending: false });
      setQtDocs((docs as QuotationDoc[]) || []);

      // Fetch all customer-signed quotations for purchases tab
      const { data: purchaseData } = await supabase
        .from('quotations')
        .select('id, qt_number, qt_date, qt_attachment, product, price, approval_status, payment_status, payment_condition, sale_assigned, customer_signed_at, deposit_value, deposit_slip_status')
        .eq('account_id', accountId)
        .in('approval_status', ['APPROVED', 'CUSTOMER_SIGNED'])
        .order('qt_date', { ascending: false });
      const items = (purchaseData as QuotationPurchase[]) || [];
      setPurchases(items);

      // Fetch installments for accurate paid/outstanding calculation
      const qtIds = items.map(q => q.id);
      let instPaidMap: Record<string, number> = {};
      if (qtIds.length > 0) {
        const { data: installments } = await supabase
          .from('payment_installments')
          .select('quotation_id, amount, slip_status')
          .in('quotation_id', qtIds);
        if (installments) {
          for (const inst of installments) {
            if (inst.slip_status === 'VERIFIED') {
              instPaidMap[inst.quotation_id] = (instPaidMap[inst.quotation_id] || 0) + (inst.amount || 0);
            }
          }
        }
      }

      const total = items.reduce((sum, q) => sum + (q.price || 0), 0);
      const paid = items.reduce((sum, q) => {
        const instPaid = instPaidMap[q.id] || 0;
        const depositPaid = (q.deposit_slip_status === 'VERIFIED' && q.deposit_value) ? q.deposit_value : 0;
        return sum + instPaid + depositPaid;
      }, 0);
      setPaidRevenue(paid);
      setOutstandingAmount(total - paid);
    }
    fetchData();
  }, [accountId]);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Tabs defaultValue="devices">
        <div className="border-b">
          <ScrollArea className="w-full">
            <TabsList className="bg-transparent h-auto p-0 w-max">
              <TabsTrigger value="devices" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Monitor size={12} /> เครื่อง
              </TabsTrigger>
              <TabsTrigger value="consumables" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <ShoppingCart size={12} /> สิ้นเปลือง
              </TabsTrigger>
              <TabsTrigger value="service" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Wrench size={12} /> เซอร์วิส
              </TabsTrigger>
              <TabsTrigger value="purchases" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Receipt size={12} /> ซื้อ
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <FolderOpen size={12} /> เอกสาร
              </TabsTrigger>
              <TabsTrigger value="marketing" className="text-xs gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Megaphone size={12} /> การตลาด
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <div className="p-4">
          {/* Devices */}
          <TabsContent value="devices" className="mt-0">
            <div className="space-y-2.5">
              {devices.map(d => (
                <div key={d.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground">{d.deviceName}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[d.status] || ''}`}>
                      {d.status === 'ACTIVE' ? 'ใช้งาน' : d.status === 'UNDER_REPAIR' ? 'ซ่อม' : 'ไม่ใช้'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">SN: {d.serialNumber}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span>ติดตั้ง: {d.installDate}</span>
                    <span>รับประกัน: {d.warrantyExpiry}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">ช่าง: {d.engineer}</p>
                </div>
              ))}
              {devices.length === 0 && <Empty />}
            </div>
          </TabsContent>

          {/* Consumables */}
          <TabsContent value="consumables" className="mt-0">
            <div className="space-y-2.5">
              {consumables.map(c => (
                <div key={c.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <p className="text-sm font-medium text-foreground">{c.cartridgeType}</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                    <span>ใช้ไปแล้ว: {c.totalUsed} ชิ้น</span>
                    <span>ราคา/ชิ้น: {formatCurrency(c.unitPrice)}</span>
                    <span>สั่งล่าสุด: {c.lastOrderDate}</span>
                    <span>คาดว่าสั่งใหม่: {c.estimatedReorderDate}</span>
                  </div>
                </div>
              ))}
              {consumables.length === 0 && <Empty />}
            </div>
          </TabsContent>

          {/* Service */}
          <TabsContent value="service" className="mt-0">
            <div className="space-y-2.5">
              {services.map(s => (
                <div key={s.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] h-5">{s.type}</Badge>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[s.status] || ''}`}>{s.status}</span>
                  </div>
                  <p className="text-sm text-foreground">{s.description}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span>{s.date}</span>
                    <span>{s.engineer}</span>
                  </div>
                </div>
              ))}
              {services.length === 0 && <Empty />}
            </div>
          </TabsContent>

          {/* Purchases — from real quotations */}
          <TabsContent value="purchases" className="mt-0">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                <p className="text-[11px] text-muted-foreground">รายได้ (ชำระแล้ว)</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(paidRevenue)}</p>
              </div>
              <div className="p-3 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <p className="text-[11px] text-muted-foreground">ยอดค้างชำระ</p>
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{formatCurrency(outstandingAmount)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {purchases.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/payments/${p.id}`)}
                  className="p-3 rounded-md bg-muted/30 border space-y-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{p.product || '-'}</p>
                      <p className="text-[11px] text-muted-foreground">{p.qt_number || '-'} • {p.qt_date || '-'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(p.price)}</p>
                      <StatusBadge status={p.payment_status || 'UNPAID'} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <CreditCard size={10} />
                    <span>{p.payment_condition || '-'}</span>
                    <span>•</span>
                    <span>{p.sale_assigned || '-'}</span>
                    <ExternalLink size={10} className="ml-auto text-primary" />
                  </div>
                </div>
              ))}
              {purchases.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">ยังไม่มีประวัติซื้อ</p>
              )}
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-0">
            <div className="space-y-1.5">
              {/* Approved Quotation PDFs */}
              {qtDocs.map(q => (
                <a
                  key={q.id}
                  href={q.qt_attachment!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <span className="text-base">📋</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{q.qt_number || 'ใบเสนอราคา'} — {q.product || ''}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ใบเสนอราคา (อนุมัติแล้ว) • {q.qt_date || '-'} • ฿{(q.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                </a>
              ))}
              {/* Mock documents */}
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors cursor-pointer">
                  <span className="text-base">{DOC_ICONS[d.docType] || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{d.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{d.docType} • {d.uploadDate}</p>
                  </div>
                </div>
              ))}
              {documents.length === 0 && qtDocs.length === 0 && <Empty />}
            </div>
          </TabsContent>

          {/* Marketing */}
          <TabsContent value="marketing" className="mt-0">
            <div className="space-y-2.5">
              {marketing.map(m => (
                <div key={m.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-foreground">{m.campaignName}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
                  </div>
                  <div className="flex gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] h-5">{m.type}</Badge>
                    <span>{m.date}</span>
                  </div>
                </div>
              ))}
              {marketing.length === 0 && <Empty />}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground text-center py-6">ไม่มีข้อมูล</p>;
}

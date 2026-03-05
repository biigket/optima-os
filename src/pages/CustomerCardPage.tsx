import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/ui/StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MOCK_SALES } from '@/hooks/useMockAuth';
import {
  ArrowLeft, Phone, MessageCircle, StickyNote, CalendarPlus, ListPlus, Pencil,
  DollarSign, Monitor, Handshake, MapPin, Building2, Users, Mail,
  ChevronDown, LayoutDashboard, Clock, FileText,
  ShoppingCart, Wrench, Receipt, FolderOpen, Megaphone,
  Eye, Presentation, FileCheck, GraduationCap,
  Phone as PhoneIcon
} from 'lucide-react';
import {
  getLifetimeRevenue, getDevicesForAccount, getVisitsForAccount,
  getTimelineForAccount, getReportsForAccount,
  getConsumablesForAccount, getServiceForAccount,
  getPurchasesForAccount, getDocumentsForAccount, getMarketingForAccount
} from '@/data/customerCardMockData';
import { mockOpportunities } from '@/data/mockData';

interface LocalAccount {
  id: string;
  clinic_name: string;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  customer_status: string;
  assigned_sale: string | null;
  grade: string | null;
}

interface LocalContact {
  id: string;
  account_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
}

const POTENTIAL_MAP: Record<string, string> = { A: 'High', B: 'Medium', C: 'Low' };

function formatCurrency(val?: number) {
  if (!val) return '฿0';
  return `฿${val.toLocaleString()}`;
}

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  VISIT: Eye, CALL: PhoneIcon, DEMO: Presentation, MEETING: Users,
  PROPOSAL: FileCheck, SERVICE: Wrench, TRAINING: GraduationCap,
};
const TIMELINE_COLORS: Record<string, string> = {
  VISIT: 'bg-blue-100 text-blue-700', CALL: 'bg-green-100 text-green-700',
  DEMO: 'bg-purple-100 text-purple-700', MEETING: 'bg-amber-100 text-amber-700',
  PROPOSAL: 'bg-indigo-100 text-indigo-700', SERVICE: 'bg-orange-100 text-orange-700',
  TRAINING: 'bg-teal-100 text-teal-700',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-muted text-muted-foreground',
  UNDER_REPAIR: 'bg-orange-100 text-orange-700', COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700', PENDING: 'bg-amber-100 text-amber-700',
  JOINED: 'bg-blue-100 text-blue-700', INVITED: 'bg-amber-100 text-amber-700',
};
const DOC_ICONS: Record<string, string> = {
  CONTRACT: '📄', QUOTATION: '📋', INVOICE: '🧾', PM_REPORT: '🔧', CERTIFICATE: '🏆',
};

export default function CustomerCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [notes, setNotes] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('accounts').select('*').eq('id', id).single(),
      supabase.from('contacts').select('id, account_id, name, role, phone, email').eq('account_id', id),
    ]).then(([accRes, conRes]) => {
      if (accRes.data) setAccount(accRes.data as unknown as LocalAccount);
      if (conRes.data) setContacts(conRes.data as unknown as LocalContact[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">ไม่พบข้อมูลลูกค้า</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          <ArrowLeft size={14} className="mr-1" /> กลับหน้าลูกค้า
        </Button>
      </div>
    );
  }

  const primaryContact = contacts[0];
  const opportunities = mockOpportunities.filter(o => o.account_id === account.id);
  const revenue = getLifetimeRevenue(account.id);
  const devices = getDevicesForAccount(account.id);
  const visits = getVisitsForAccount(account.id);
  const timeline = getTimelineForAccount(account.id);
  const reports = getReportsForAccount(account.id);
  const consumables = getConsumablesForAccount(account.id);
  const services = getServiceForAccount(account.id);
  const purchases = getPurchasesForAccount(account.id);
  const documents = getDocumentsForAccount(account.id);
  const marketing = getMarketingForAccount(account.id);
  const activeDeals = opportunities.filter(o => !['WON', 'LOST', 'CLOSED'].includes(o.stage)).length;
  const lastVisit = visits.length > 0 ? visits[0].date : '-';

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-muted-foreground hover:text-foreground mb-3 -ml-2">
        <ArrowLeft size={16} /> กลับ
      </Button>

      {/* ===== HEADER: Identity + Clinic Info + Contacts ===== */}
      <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm mb-4 space-y-4">
        {/* Row 1: Name + Quick Stats */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-foreground">{account.clinic_name}</h1>
              <StatusBadge status={account.customer_status} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">เกรด {account.grade}</Badge>
              <Badge variant="secondary" className="text-xs">Potential: {POTENTIAL_MAP[account.grade || 'C']}</Badge>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0">
            <QuickStat icon={DollarSign} label="รายได้รวม" value={formatCurrency(revenue)} />
            <QuickStat icon={Monitor} label="เครื่อง" value={`${devices.length}`} />
            <QuickStat icon={Handshake} label="ดีลเปิด" value={`${activeDeals}`} />
            <QuickStat icon={MapPin} label="เยี่ยมล่าสุด" value={lastVisit} />
          </div>
        </div>

        {/* Row 2: Clinic + Contact Info inline */}
        <div className={cn("grid gap-3 pt-3 border-t border-border", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          {/* Clinic Info */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Building2 size={12} /> ข้อมูลคลินิก</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
              <span className="flex items-center gap-1 text-xs"><MapPin size={11} className="text-muted-foreground" /> {account.address}</span>
              <span className="flex items-center gap-1 text-xs"><Phone size={11} className="text-muted-foreground" /> {account.phone}</span>
              {account.email && <span className="flex items-center gap-1 text-xs"><Mail size={11} className="text-muted-foreground" /> {account.email}</span>}
              <span className="flex items-center gap-1 text-xs">🧑‍💼 {account.assigned_sale}</span>
            </div>
          </div>
          {/* Contacts */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Users size={12} /> ผู้ติดต่อ ({contacts.length})</p>
            <div className="flex flex-wrap gap-2">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/40 text-xs">
                  <div>
                    <span className="font-medium text-foreground">{c.name}</span>
                    {c.role && <span className="text-muted-foreground ml-1">({c.role})</span>}
                  </div>
                  {c.phone && <span className="text-muted-foreground">{c.phone}</span>}
                </div>
              ))}
              {contacts.length === 0 && <span className="text-xs text-muted-foreground">ยังไม่มีผู้ติดต่อ</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 h-8" onClick={() => {
            setEditForm({
              clinic_name: account.clinic_name,
              company_name: account.company_name || '',
              address: account.address || '',
              phone: account.phone || '',
              email: account.email || '',
              customer_status: account.customer_status,
              assigned_sale: account.assigned_sale || '',
              grade: account.grade || '',
            });
            setEditOpen(true);
          }}>
            <Pencil size={13} /> แก้ไข
          </Button>
          <ActionBtn icon={Phone} label="โทร" />
          <ActionBtn icon={MessageCircle} label="LINE" />
          <ActionBtn icon={StickyNote} label="เพิ่มโน้ต" />
          <ActionBtn icon={CalendarPlus} label="นัดเยี่ยม" />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 h-8" onClick={() => navigate(`/opportunities?create=${account.id}`)}>
            <Handshake size={13} /> สร้างโอกาสขาย
          </Button>
          <ActionBtn icon={ListPlus} label="สร้างงาน" />
        </div>
      </div>

      {/* ===== SINGLE TAB PANEL ===== */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Tabs defaultValue="overview">
          <div className="border-b">
            <ScrollArea className="w-full">
              <TabsList className="bg-transparent h-auto p-0 w-max">
                {[
                  { value: 'overview', icon: LayoutDashboard, label: 'ภาพรวม' },
                  { value: 'deals', icon: Handshake, label: 'โอกาสขาย' },
                  { value: 'visits', icon: MapPin, label: 'การเยี่ยม / รายงาน' },
                  { value: 'devices', icon: Monitor, label: 'เครื่องที่ติดตั้งแล้ว' },
                  { value: 'consumables', icon: ShoppingCart, label: 'Consumable' },
                  { value: 'service', icon: Wrench, label: 'เซอร์วิส' },
                  { value: 'purchases', icon: Receipt, label: 'ซื้อ' },
                  { value: 'documents', icon: FolderOpen, label: 'เอกสาร' },
                  { value: 'marketing', icon: Megaphone, label: 'การตลาด' },
                ].map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5 shrink-0">
                    <t.icon size={13} /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <div className="p-4 md:p-5">
            {/* ===== OVERVIEW (with Timeline + Notes) ===== */}
            <TabsContent value="overview" className="mt-0 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiMini label="เยี่ยมล่าสุด" value={lastVisit} />
                <KpiMini label="ดีลที่เปิดอยู่" value={`${activeDeals} รายการ`} />
                <KpiMini label="รายได้รวม" value={formatCurrency(revenue)} />
                <KpiMini label="เครื่องที่ติดตั้ง" value={`${devices.length} เครื่อง`} />
                <KpiMini label="สั่ง Cartridge ล่าสุด" value={visits.length > 0 ? visits[0].date : '-'} />
                <KpiMini label="แอคชั่นถัดไป" value={visits.length > 0 ? visits[0].nextStep : '-'} />
              </div>

              {/* Internal Notes */}
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2"><StickyNote size={12} /> บันทึกภายใน</p>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="text-xs min-h-[80px] resize-none bg-muted/30 border-muted"
                  placeholder="เพิ่มบันทึก..."
                />
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-3"><Clock size={12} /> ไทม์ไลน์</p>
                <div className="space-y-3">
                  {timeline.map(ev => {
                    const Icon = TIMELINE_ICONS[ev.type] || Clock;
                    const colorClass = TIMELINE_COLORS[ev.type] || 'bg-muted text-muted-foreground';
                    return (
                      <div key={ev.id} className="flex gap-3 items-start">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${colorClass}`}>
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1 pb-3 border-b border-border last:border-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ev.date}</span><span>•</span><span>{ev.user}</span>
                          </div>
                          <p className="text-sm text-foreground mt-0.5">{ev.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  {timeline.length === 0 && <Empty text="ยังไม่มีกิจกรรม" />}
                </div>
              </div>
            </TabsContent>

            {/* ===== DEALS (โอกาสขาย) ===== */}
            <TabsContent value="deals" className="mt-0">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">สินค้า</TableHead>
                      <TableHead className="text-xs">มูลค่า</TableHead>
                      <TableHead className="text-xs">ขั้นตอน</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">ปิดภายใน</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">เซลล์</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opportunities.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs">{(o.interested_products || []).join(', ') || '-'}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(o.expected_value)}</TableCell>
                        <TableCell><StatusBadge status={o.stage} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{o.close_date || '-'}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{o.assigned_sale || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {opportunities.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">ไม่มีโอกาสขาย</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ===== VISITS + REPORTS (การเยี่ยม / รายงาน) ===== */}
            <TabsContent value="visits" className="mt-0 space-y-5">
              {/* Visits */}
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-3"><MapPin size={12} /> บันทึกการเยี่ยม</p>
                <div className="space-y-3">
                  {visits.map(v => (
                    <div key={v.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{v.date}</span>
                        <Badge variant="outline" className="text-[10px] h-5">{v.salesPerson}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{v.purpose}</p>
                      <p className="text-xs text-muted-foreground">{v.summary}</p>
                      <p className="text-xs text-primary">ถัดไป: {v.nextStep}</p>
                    </div>
                  ))}
                  {visits.length === 0 && <Empty text="ยังไม่มีบันทึกการเยี่ยม" />}
                </div>
              </div>
              {/* Reports */}
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-3"><FileText size={12} /> รายงาน / Market Intelligence</p>
                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="p-3 rounded-md bg-muted/30 border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        <Badge variant={r.interestLevel === 'HIGH' ? 'default' : 'secondary'} className="text-[10px] h-5">สนใจ: {r.interestLevel}</Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p><span className="text-muted-foreground">Feedback:</span> <span className="text-foreground">{r.doctorFeedback}</span></p>
                        <p><span className="text-muted-foreground">คู่แข่ง:</span> <span className="text-foreground">{r.competitorMentioned}</span></p>
                        <p><span className="text-muted-foreground">ข้อโต้แย้ง:</span> <span className="text-foreground">{r.objections}</span></p>
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && <Empty text="ยังไม่มีรายงาน" />}
                </div>
              </div>
            </TabsContent>

            {/* ===== DEVICES ===== */}
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
                {devices.length === 0 && <Empty text="ยังไม่มีเครื่องที่ติดตั้ง" />}
              </div>
            </TabsContent>

            {/* ===== CONSUMABLES ===== */}
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
                {consumables.length === 0 && <Empty text="ไม่มีข้อมูล" />}
              </div>
            </TabsContent>

            {/* ===== SERVICE ===== */}
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
                      <span>{s.date}</span><span>{s.engineer}</span>
                    </div>
                  </div>
                ))}
                {services.length === 0 && <Empty text="ไม่มีข้อมูล" />}
              </div>
            </TabsContent>

            {/* ===== PURCHASES ===== */}
            <TabsContent value="purchases" className="mt-0">
              <div className="p-3 rounded-md bg-primary/5 border border-primary/10 mb-3">
                <p className="text-[11px] text-muted-foreground">รายได้ตลอดอายุลูกค้า</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(revenue)}</p>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">สินค้า</TableHead>
                      <TableHead className="text-xs">ราคา</TableHead>
                      <TableHead className="text-xs">วันที่</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">{p.product}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(p.price)}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">{p.invoiceDate}</TableCell>
                      </TableRow>
                    ))}
                    {purchases.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-xs">ยังไม่มีประวัติซื้อ</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ===== DOCUMENTS ===== */}
            <TabsContent value="documents" className="mt-0">
              <div className="space-y-1.5">
                {documents.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors cursor-pointer">
                    <span className="text-base">{DOC_ICONS[d.docType] || '📄'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground truncate">{d.fileName}</p>
                      <p className="text-[10px] text-muted-foreground">{d.docType} • {d.uploadDate}</p>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <Empty text="ไม่มีเอกสาร" />}
              </div>
            </TabsContent>

            {/* ===== MARKETING ===== */}
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
                {marketing.length === 0 && <Empty text="ไม่มีข้อมูล" />}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกค้า</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลและกดบันทึก</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อคลินิก *</Label>
              <Input value={editForm.clinic_name || ''} onChange={e => setEditForm(f => ({ ...f, clinic_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อบริษัท</Label>
              <Input value={editForm.company_name || ''} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>ที่อยู่</Label>
              <Input value={editForm.address || ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>โทรศัพท์</Label>
              <Input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={editForm.customer_status || 'NEW_LEAD'} onValueChange={v => setEditForm(f => ({ ...f, customer_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW_LEAD">ลูกค้าใหม่</SelectItem>
                  <SelectItem value="CONTACTED">ติดต่อแล้ว</SelectItem>
                  <SelectItem value="DEMO_SCHEDULED">นัด Demo</SelectItem>
                  <SelectItem value="DEMO_DONE">Demo แล้ว</SelectItem>
                  <SelectItem value="NEGOTIATION">เจรจา</SelectItem>
                  <SelectItem value="PURCHASED">ซื้อแล้ว</SelectItem>
                  <SelectItem value="DORMANT">ไม่เคลื่อนไหว</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>เซลล์ผู้ดูแล</Label>
              <Select value={editForm.assigned_sale || ''} onValueChange={v => setEditForm(f => ({ ...f, assigned_sale: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือกเซลล์" /></SelectTrigger>
                <SelectContent>
                  {MOCK_SALES.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>เกรด</Label>
              <Select value={editForm.grade || ''} onValueChange={v => setEditForm(f => ({ ...f, grade: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button onClick={() => {
              toast.success('บันทึกข้อมูลสำเร็จ');
              setEditOpen(false);
            }}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/60 whitespace-nowrap shrink-0">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-primary" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 h-8">
      <Icon size={13} /> {label}
    </Button>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-muted/40">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground text-center py-8">{text}</p>;
}

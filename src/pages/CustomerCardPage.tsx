import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomerLeftSidebar from '@/components/customer-card/CustomerLeftSidebar';
import CustomerCenterPanel from '@/components/customer-card/CustomerCenterPanel';
import CustomerRightPanel from '@/components/customer-card/CustomerRightPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ArrowLeft, Phone, MessageCircle, StickyNote, CalendarPlus, ListPlus,
  DollarSign, Monitor, Handshake, MapPin, Building2, BarChart3, Activity
} from 'lucide-react';
import {
  getLifetimeRevenue, getDevicesForAccount, getVisitsForAccount
} from '@/data/customerCardMockData';
import { mockOpportunities } from '@/data/mockData';

const localAccounts = [
  { id: '1', clinic_name: 'Clarity Clinic', company_name: 'Clarity Co., Ltd.', address: 'สุขุมวิท 39, กรุงเทพฯ', phone: '02-123-4567', email: 'info@clarity.co.th', customer_status: 'DEMO_SCHEDULED', assigned_sale: 'FORD', grade: 'A' },
  { id: '2', clinic_name: 'Aura Med Spa', company_name: 'Aura Group', address: 'นิมมานเหมินทร์, เชียงใหม่', phone: '053-222-333', email: 'hello@aura.co.th', customer_status: 'PURCHASED', assigned_sale: 'VARN', grade: 'A' },
  { id: '3', clinic_name: 'Derma Plus', company_name: null, address: 'พัทยาใต้, ชลบุรี', phone: '038-111-222', email: null, customer_status: 'NEW_LEAD', assigned_sale: 'PETCH', grade: 'B' },
  { id: '4', clinic_name: 'Skin Lab Bangkok', company_name: 'Skin Lab Co., Ltd.', address: 'ทองหล่อ ซอย 10, กรุงเทพฯ', phone: '02-999-8888', email: 'contact@skinlab.co.th', customer_status: 'NEGOTIATION', assigned_sale: 'FAH', grade: 'A' },
  { id: '5', clinic_name: 'Glow Aesthetic', company_name: null, address: 'หาดใหญ่, สงขลา', phone: '074-333-444', email: 'glow@email.com', customer_status: 'CONTACTED', assigned_sale: 'VI', grade: 'B' },
  { id: '6', clinic_name: 'Radiance Center', company_name: 'Radiance Medical', address: 'ราชดำริ, กรุงเทพฯ', phone: '02-555-6666', email: 'info@radiance.co.th', customer_status: 'DORMANT', assigned_sale: 'FORD', grade: 'C' },
  { id: '7', clinic_name: 'Beauty First', company_name: 'BF Clinic Co., Ltd.', address: 'เซ็นทรัลเวิลด์, กรุงเทพฯ', phone: '02-777-8888', email: 'bf@beautyfirst.co.th', customer_status: 'PURCHASED', assigned_sale: 'PETCH', grade: 'A' },
  { id: '8', clinic_name: 'Nova Skin Clinic', company_name: null, address: 'ขอนแก่น', phone: '043-222-111', email: null, customer_status: 'DEMO_DONE', assigned_sale: 'VARN', grade: 'B' },
  { id: '9', clinic_name: 'Zen Clinic', company_name: null, address: 'เอกมัย, กรุงเทพฯ', phone: '02-444-5555', email: 'zen@email.com', customer_status: 'NEW_LEAD', assigned_sale: 'FAH', grade: 'B' },
  { id: '10', clinic_name: 'Luxe Dermatology', company_name: 'Luxe Med Co., Ltd.', address: 'สีลม, กรุงเทพฯ', phone: '02-666-7777', email: 'info@luxe.co.th', customer_status: 'CONTACTED', assigned_sale: 'VI', grade: 'A' },
];

const localContacts = [
  { id: 'c1', account_id: '1', name: 'นพ. Big', role: 'Medical Director', phone: '081-111-2222', email: 'big@clarity.co.th' },
  { id: 'c2', account_id: '2', name: 'พญ. สมศรี', role: 'Owner', phone: '089-333-4444', email: 'somsri@aura.co.th' },
  { id: 'c3', account_id: '3', name: 'คุณมานี', role: 'Clinic Manager', phone: '086-555-6666', email: null },
  { id: 'c4', account_id: '4', name: 'นพ. วิชัย', role: 'Owner', phone: '082-777-8888', email: 'wichai@skinlab.co.th' },
  { id: 'c5', account_id: '5', name: 'พญ. แก้ว', role: 'Doctor', phone: '087-999-0000', email: null },
  { id: 'c6', account_id: '6', name: 'คุณสมชาย', role: 'Manager', phone: '081-444-5555', email: 'somchai@radiance.co.th' },
  { id: 'c7', account_id: '7', name: 'คุณลิลลี่', role: 'Owner', phone: '085-222-3333', email: 'lily@beautyfirst.co.th' },
  { id: 'c8', account_id: '8', name: 'พญ. นภา', role: 'Doctor', phone: '088-666-7777', email: null },
];

const POTENTIAL_MAP: Record<string, string> = { A: 'High', B: 'Medium', C: 'Low' };

function formatCurrency(val?: number) {
  if (!val) return '฿0';
  return `฿${val.toLocaleString()}`;
}

export default function CustomerCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('activity');

  const account = localAccounts.find(a => a.id === id);
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

  const contacts = localContacts.filter(c => c.account_id === account.id);
  const primaryContact = contacts[0];
  const opportunities = mockOpportunities.filter(o => o.account_id === account.id);
  const revenue = getLifetimeRevenue(account.id);
  const devices = getDevicesForAccount(account.id);
  const visits = getVisitsForAccount(account.id);
  const activeDeals = opportunities.filter(o => !['WON', 'LOST', 'CLOSED'].includes(o.stage)).length;
  const lastVisit = visits.length > 0 ? visits[0].date : '-';

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-muted-foreground hover:text-foreground mb-3 -ml-2">
        <ArrowLeft size={16} /> กลับ
      </Button>

      {/* ===== TOP HEADER ===== */}
      <div className="rounded-xl border bg-card p-4 md:p-6 shadow-sm mb-4">
        {/* Row 1: Name + Stats */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-foreground">{account.clinic_name}</h1>
              <StatusBadge status={account.customer_status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
              {primaryContact && <span>👨‍⚕️ {primaryContact.name} ({primaryContact.role})</span>}
              <span>📍 {account.address}</span>
              <span>🧑‍💼 {account.assigned_sale}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">เกรด {account.grade}</Badge>
              <Badge variant="secondary" className="text-xs">Potential: {POTENTIAL_MAP[account.grade || 'C']}</Badge>
            </div>
          </div>

          {/* Quick Stats - horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 shrink-0">
            <QuickStat icon={DollarSign} label="รายได้รวม" value={formatCurrency(revenue)} />
            <QuickStat icon={Monitor} label="เครื่อง" value={`${devices.length}`} />
            <QuickStat icon={Handshake} label="ดีลเปิด" value={`${activeDeals}`} />
            <QuickStat icon={MapPin} label="เยี่ยมล่าสุด" value={lastVisit} />
          </div>
        </div>

        {/* Action Buttons - scrollable on mobile */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-border overflow-x-auto pb-1">
          <ActionBtn icon={Phone} label="โทร" />
          <ActionBtn icon={MessageCircle} label="LINE" />
          <ActionBtn icon={StickyNote} label="เพิ่มโน้ต" />
          <ActionBtn icon={CalendarPlus} label="นัดเยี่ยม" />
          <ActionBtn icon={ListPlus} label="สร้างงาน" />
        </div>
      </div>

      {/* ===== MOBILE: Section Switcher ===== */}
      {isMobile ? (
        <div className="space-y-4">
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList className="w-full grid grid-cols-3 h-10">
              <TabsTrigger value="info" className="text-xs gap-1"><Building2 size={13} /> ข้อมูล</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1"><Activity size={13} /> กิจกรรม</TabsTrigger>
              <TabsTrigger value="assets" className="text-xs gap-1"><BarChart3 size={13} /> สินทรัพย์</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-3">
              <CustomerLeftSidebar account={account} contacts={contacts} />
            </TabsContent>
            <TabsContent value="activity" className="mt-3">
              <CustomerCenterPanel accountId={account.id} opportunities={opportunities} />
            </TabsContent>
            <TabsContent value="assets" className="mt-3">
              <CustomerRightPanel accountId={account.id} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* ===== DESKTOP: 3-Column Grid ===== */
        <div className="grid grid-cols-[260px_1fr_300px] gap-4 xl:grid-cols-[280px_1fr_320px] xl:gap-5">
          <div>
            <CustomerLeftSidebar account={account} contacts={contacts} />
          </div>
          <div className="min-w-0">
            <CustomerCenterPanel accountId={account.id} opportunities={opportunities} />
          </div>
          <div>
            <CustomerRightPanel accountId={account.id} />
          </div>
        </div>
      )}
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

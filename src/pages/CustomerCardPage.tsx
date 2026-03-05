import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import StatusBadge from '@/components/ui/StatusBadge';
import CustomerLeftSidebar from '@/components/customer-card/CustomerLeftSidebar';
import CustomerCenterPanel from '@/components/customer-card/CustomerCenterPanel';
import CustomerRightPanel from '@/components/customer-card/CustomerRightPanel';
import {
  ArrowLeft, Phone, MessageCircle, StickyNote, CalendarPlus, ListPlus,
  DollarSign, Monitor, Handshake, MapPin
} from 'lucide-react';
import {
  getLifetimeRevenue, getDevicesForAccount, getVisitsForAccount
} from '@/data/customerCardMockData';
import { mockOpportunities, mockContacts, mockAccounts } from '@/data/mockData';

// Use the LeadsPage mock data format — re-import local accounts
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
    <div className="space-y-4 animate-fade-in">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft size={16} /> กลับ
      </Button>

      {/* Top Header */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left: Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">{account.clinic_name}</h1>
              <StatusBadge status={account.customer_status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {primaryContact && <span>👨‍⚕️ {primaryContact.name} ({primaryContact.role})</span>}
              <span>📍 {account.address}</span>
              <span>🧑‍💼 {account.assigned_sale}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">เกรด {account.grade}</Badge>
              <Badge variant="secondary" className="text-xs">Potential: {POTENTIAL_MAP[account.grade || 'C']}</Badge>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <QuickStat icon={DollarSign} label="รายได้รวม" value={formatCurrency(revenue)} />
            <QuickStat icon={Monitor} label="เครื่อง" value={`${devices.length}`} />
            <QuickStat icon={Handshake} label="ดีลเปิด" value={`${activeDeals}`} />
            <QuickStat icon={MapPin} label="เยี่ยมล่าสุด" value={lastVisit} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Phone size={13} /> โทร</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><MessageCircle size={13} /> LINE</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><StickyNote size={13} /> เพิ่มโน้ต</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><CalendarPlus size={13} /> นัดเยี่ยม</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><ListPlus size={13} /> สร้างงาน</Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4">
        {/* Left */}
        <div className="order-2 lg:order-1">
          <CustomerLeftSidebar account={account} contacts={contacts} />
        </div>

        {/* Center */}
        <div className="order-1 lg:order-2 min-w-0">
          <CustomerCenterPanel accountId={account.id} opportunities={opportunities} />
        </div>

        {/* Right */}
        <div className="order-3">
          <CustomerRightPanel accountId={account.id} />
        </div>
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
      <Icon size={16} className="text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

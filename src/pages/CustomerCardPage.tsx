import { useState, useEffect, useCallback } from 'react';
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
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MOCK_SALES } from '@/hooks/useMockAuth';
import {
  ArrowLeft, Phone, MessageCircle, StickyNote, CalendarPlus, ListPlus, Pencil,
  DollarSign, Monitor, Handshake, MapPin, Building2, Users, Mail,
  ChevronDown, LayoutDashboard, Clock, FileText,
  ShoppingCart, Wrench, Receipt, FolderOpen, Megaphone, ImageIcon,
  Eye, Presentation, FileCheck, GraduationCap,
  Phone as PhoneIcon, Star, Trash2, ExternalLink
} from 'lucide-react';
import {
  getLifetimeRevenue, getDevicesForAccount, getVisitsForAccount,
  getTimelineForAccount, getReportsForAccount,
  getConsumablesForAccount, getServiceForAccount,
  getPurchasesForAccount, getDocumentsForAccount, getMarketingForAccount
} from '@/data/customerCardMockData';
import type { Opportunity, Activity } from '@/types';
import HistoryTimeline from '@/components/opportunity-detail/HistoryTimeline';
import { useOpportunityNotes, type OpportunityNote } from '@/hooks/useOpportunityNotes';

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
  tax_id: string | null;
  entity_type: string | null;
  branch_type: string | null;
  lead_source: string | null;
  single_or_chain: string | null;
  current_devices: string | null;
  notes: string | null;
}

interface LocalContact {
  id: string;
  account_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  is_decision_maker: boolean | null;
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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '', email: '' });
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<LocalContact | null>(null);
  const [editContactForm, setEditContactForm] = useState({ name: '', role: '', phone: '', email: '' });
  const [accountActivities, setAccountActivities] = useState<Activity[]>([]);
  const [accountStageHistory, setAccountStageHistory] = useState<{ from: string; to: string; date: string }[]>([]);
  const [accountNotes, setAccountNotes] = useState<OpportunityNote[]>([]);
  const [accountPinnedIds, setAccountPinnedIds] = useState<Set<string>>(new Set());
  const [chatImages, setChatImages] = useState<{ id: string; file_url: string; file_name: string; uploaded_by: string | null; created_at: string; opportunity_id: string }[]>([]);
  const [visitReports, setVisitReports] = useState<any[]>([]);
  const [demoReports, setDemoReports] = useState<any[]>([]);
  const [qtDocs, setQtDocs] = useState<{ id: string; qt_number: string | null; qt_date: string | null; qt_attachment: string | null; product: string | null; price: number | null; approval_status: string | null; customer_signed_at: string | null; payment_status: string | null; payment_condition: string | null; sale_assigned: string | null }[]>([]);

  // Fetch activities, stage history, and notes for this account
  useEffect(() => {
    if (!id) return;
    // Activities (done) for timeline
    supabase.from('activities').select('*').eq('account_id', id).eq('is_done', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAccountActivities(data as unknown as Activity[]); });
    // Stage history across all opportunities for this account
    supabase.from('opportunity_stage_history').select('*')
      .in('opportunity_id', opportunities.map(o => o.id).length > 0 ? opportunities.map(o => o.id) : ['__none__'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAccountStageHistory(data.map((r: any) => ({ from: r.from_stage, to: r.to_stage, date: r.created_at })));
      });
    // Notes
    supabase.from('opportunity_notes').select('*').eq('account_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const notes = data as unknown as OpportunityNote[];
          setAccountNotes(notes);
          setAccountPinnedIds(new Set(notes.filter(n => n.is_pinned).map(n => n.id)));
        }
      });
    // Chat screenshot images
    supabase.from('opportunity_files').select('*').eq('account_id', id).eq('file_type', 'chat_screenshot')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setChatImages(data as any);
      });
    // Visit reports
    supabase.from('visit_reports').select('*').eq('account_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setVisitReports(data);
      });
    // Demo reports (submitted)
    supabase.from('demos').select('*').eq('account_id', id).eq('report_submitted', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setDemoReports(data);
      });
    // Approved / Customer-signed quotation docs
    supabase.from('quotations').select('id, qt_number, qt_date, qt_attachment, product, price, approval_status, customer_signed_at, payment_status, payment_condition, sale_assigned')
      .eq('account_id', id).in('approval_status', ['APPROVED', 'CUSTOMER_SIGNED'])
      .order('qt_date', { ascending: false })
      .then(({ data }) => {
        if (data) setQtDocs(data as any);
      });
  }, [id, opportunities]);
  const handleSubmit = async () => {
    if (!editForm.clinic_name?.trim()) {
      toast.error('กรุณากรอกชื่อคลินิก');
      return;
    }
    const resolvedLeadSource = editForm.lead_source === 'OTHER' ? (editForm.custom_lead_source || null) : (editForm.lead_source || null);
    const payload = {
      clinic_name: editForm.clinic_name.trim(),
      company_name: editForm.company_name || null,
      address: editForm.address || null,
      tax_id: editForm.tax_id || null,
      entity_type: editForm.entity_type || null,
      branch_type: editForm.branch_type || null,
      phone: editForm.phone || null,
      email: editForm.email || null,
      customer_status: editForm.customer_status || 'NEW_LEAD',
      assigned_sale: editForm.assigned_sale || null,
      lead_source: resolvedLeadSource,
      notes: editForm.notes || null,
      grade: editForm.grade || null,
      single_or_chain: editForm.single_or_chain || null,
      current_devices: (editForm.current_devices || '').trim() || null,
    };
    const { error } = await supabase.from('accounts').update(payload).eq('id', account!.id);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('บันทึกข้อมูลสำเร็จ');
    setEditOpen(false);
    const { data } = await supabase.from('accounts').select('*').eq('id', account!.id).single();
    if (data) setAccount(data as unknown as LocalAccount);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from('accounts').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('account_id', id),
      supabase.from('opportunities').select('*').eq('account_id', id).order('created_at', { ascending: false }),
    ]).then(([accRes, conRes, oppRes]) => {
      if (accRes.data) setAccount(accRes.data as unknown as LocalAccount);
      if (conRes.data) setContacts(conRes.data as unknown as LocalContact[]);
      if (oppRes.data) setOpportunities(oppRes.data as unknown as Opportunity[]);
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
  const revenue = getLifetimeRevenue(account.id);
  const devices = getDevicesForAccount(account.id);
  const visits = getVisitsForAccount(account.id);
  const timeline = getTimelineForAccount(account.id);
  const reports = getReportsForAccount(account.id);
  const consumables = getConsumablesForAccount(account.id);
  const services = getServiceForAccount(account.id);
  const documents = getDocumentsForAccount(account.id);
  const marketing = getMarketingForAccount(account.id);
  const activeDeals = opportunities.filter(o => !['WON', 'LOST', 'CLOSED'].includes(o.stage)).length;
  const lastVisit = visits.length > 0 ? visits[0].date : '-';
  const realRevenue = qtDocs.reduce((sum, q) => sum + (q.price || 0), 0);

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 text-muted-foreground hover:text-foreground mb-3 -ml-2">
        <ArrowLeft size={16} /> กลับ
      </Button>

      <div className="rounded-xl border bg-card p-4 md:p-5 shadow-sm mb-4 space-y-4">
        {/* Row 1: Name + Status + Badges + Quick Stats */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-foreground">{account.clinic_name}</h1>
              <StatusBadge status={account.customer_status} />
            </div>
            <div className="flex items-center gap-1 ml-1">
              {[1, 2, 3].map((star) => {
                const gradeMap: Record<string, number> = { C: 1, B: 2, A: 3 };
                const currentStars = gradeMap[account.grade || ''] || 0;
                const filled = star <= currentStars;
                return (
                  <button
                    key={star}
                    onClick={async () => {
                      const reverseMap: Record<number, string> = { 1: 'C', 2: 'B', 3: 'A' };
                      const newGrade = star === currentStars ? null : reverseMap[star];
                      const { error } = await supabase.from('accounts').update({ grade: newGrade }).eq('id', account.id);
                      if (!error) {
                        setAccount(prev => prev ? { ...prev, grade: newGrade } : prev);
                        toast.success('อัปเดตเกรดแล้ว');
                      }
                    }}
                    className="p-0 hover:scale-125 transition-transform"
                  >
                    <Star
                      size={18}
                      className={cn(
                        'transition-colors',
                        filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            {account.company_name && <p className="text-xs text-muted-foreground">บริษัท: {account.company_name}</p>}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0">
            <QuickStat icon={DollarSign} label="รายได้รวม" value={formatCurrency(realRevenue)} />
            <QuickStat icon={Monitor} label="เครื่อง" value={`${devices.length}`} />
            <QuickStat icon={Handshake} label="ดีลเปิด" value={`${activeDeals}`} />
            <QuickStat icon={MapPin} label="เยี่ยมล่าสุด" value={lastVisit} />
          </div>
        </div>

        {/* Row 2: All Account Details */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2"><Building2 size={12} /> ข้อมูลคลินิก</p>
          <div className={cn("grid gap-x-6 gap-y-1.5", isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3")}>
            {account.address && <InfoItem label="ที่อยู่" value={account.address} />}
            {account.phone && <InfoItem label="โทร" value={account.phone} isPhone />}
            {account.email && <InfoItem label="อีเมล" value={account.email} />}
            {account.tax_id && <InfoItem label="เลขผู้เสียภาษี" value={account.tax_id} />}
            {account.entity_type && <InfoItem label="ประเภทนิติบุคคล" value={account.entity_type} />}
            {account.branch_type && <InfoItem label="ประเภทสาขา" value={account.branch_type} />}
            <div className="flex items-start gap-1.5 text-xs">
              <span className="text-muted-foreground shrink-0 min-w-[80px]">เซลล์ดูแล</span>
              <Select
                value={account.assigned_sale || ''}
                onValueChange={async (newSale) => {
                  const { error: accErr } = await supabase.from('accounts').update({ assigned_sale: newSale }).eq('id', account.id);
                  if (accErr) { toast.error('อัปเดตเซลล์ไม่สำเร็จ'); return; }
                  const { error: oppErr } = await supabase.from('opportunities').update({ assigned_sale: newSale }).eq('account_id', account.id);
                  if (oppErr) { toast.error('อัปเดตดีลไม่สำเร็จ'); return; }
                  setAccount(prev => prev ? { ...prev, assigned_sale: newSale } : prev);
                  setOpportunities(prev => prev.map(o => ({ ...o, assigned_sale: newSale })));
                  toast.success(`เปลี่ยนเซลล์เป็น ${newSale} แล้ว (รวมดีลทั้งหมด)`);
                }}
              >
                <SelectTrigger className="h-6 text-xs w-auto min-w-[100px] border-dashed">
                  <SelectValue placeholder="ยังไม่ระบุ" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_SALES.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {account.lead_source && <InfoItem label="แหล่งที่มา" value={account.lead_source} />}
            {account.current_devices && <InfoItem label="อุปกรณ์ที่มี" value={account.current_devices} />}
          </div>
          {account.notes && (
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">หมายเหตุ: </span>
              <span className="text-foreground">{account.notes}</span>
            </div>
          )}
        </div>

        {/* Row 3: All Contacts */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2"><Users size={12} /> ผู้ติดต่อ ({contacts.length})</p>
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{c.name}</span>
                  {c.role && <span className="text-muted-foreground">({c.role})</span>}
                  {c.is_decision_maker && <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">⭐ ผู้ตัดสินใจ</Badge>}
                </div>
                {c.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={11} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{c.phone}</span>
                    <a href={`tel:${c.phone}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors" title={`โทร ${c.phone}`}>
                      <Phone size={11} />
                    </a>
                  </span>
                )}
                {c.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail size={11} /> {c.email}</span>}
                {c.line_id && <span className="flex items-center gap-1 text-muted-foreground"><MessageCircle size={11} /> {c.line_id}</span>}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => {
                      setEditingContact(c);
                      setEditContactForm({ name: c.name, role: c.role || '', phone: c.phone || '', email: c.email || '' });
                      setEditContactOpen(true);
                    }}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="แก้ไขผู้ติดต่อ"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`ลบผู้ติดต่อ "${c.name}" ?`)) return;
                      const { error } = await supabase.from('contacts').delete().eq('id', c.id);
                      if (error) { toast.error('ลบไม่สำเร็จ'); return; }
                      setContacts(prev => prev.filter(x => x.id !== c.id));
                      toast.success('ลบผู้ติดต่อแล้ว');
                    }}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="ลบผู้ติดต่อ"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <span className="text-xs text-muted-foreground">ยังไม่มีผู้ติดต่อ</span>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 h-8" onClick={() => {
            const isCustomSource = account.lead_source && !['เพื่อนแนะนำ', 'Social media', 'งานแสดงสินค้า'].includes(account.lead_source);
            setEditForm({
              clinic_name: account.clinic_name,
              company_name: account.company_name || '',
              address: account.address || '',
              tax_id: account.tax_id || '',
              entity_type: account.entity_type || '',
              branch_type: account.branch_type || '',
              phone: account.phone || '',
              email: account.email || '',
              customer_status: account.customer_status,
              assigned_sale: account.assigned_sale || '',
              lead_source: isCustomSource ? 'OTHER' : (account.lead_source || ''),
              notes: account.notes || '',
              grade: account.grade || '',
              single_or_chain: account.single_or_chain || '',
              current_devices: account.current_devices || '',
              custom_lead_source: isCustomSource ? account.lead_source! : '',
            });
            setEditOpen(true);
          }}>
            <Pencil size={13} /> แก้ไข
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0 h-8" onClick={() => {
            setNewContact({ name: '', role: '', phone: '', email: '' });
            setAddContactOpen(true);
          }}>
            <Users size={13} /> เพิ่มผู้ติดต่อ
          </Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Tabs defaultValue="overview">
          <div className="border-b">
            <ScrollArea className="w-full">
              <TabsList className="bg-transparent h-auto p-0 w-max">
                {[
                  { value: 'overview', icon: LayoutDashboard, label: 'ภาพรวม' },
                  { value: 'deals', icon: Handshake, label: 'โอกาสขาย' },
                  { value: 'visits', icon: MapPin, label: 'การเยี่ยม / รายงาน' },
                  { value: 'demo-reports', icon: Presentation, label: `รายงานเคส DEMO${demoReports.length > 0 ? ` (${demoReports.length})` : ''}` },
                  { value: 'devices', icon: Monitor, label: 'เครื่องที่ติดตั้งแล้ว' },
                  { value: 'consumables', icon: ShoppingCart, label: 'Consumable' },
                  { value: 'service', icon: Wrench, label: 'เซอร์วิส' },
                  { value: 'purchases', icon: Receipt, label: 'ซื้อ' },
                  { value: 'documents', icon: FolderOpen, label: 'เอกสาร' },
                  { value: 'marketing', icon: Megaphone, label: 'การตลาด' },
                  { value: 'chat_images', icon: ImageIcon, label: `รูปแชท (${chatImages.length})` },
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

              {/* Timeline from DB */}
              <HistoryTimeline
                activities={accountActivities}
                stageHistory={accountStageHistory}
                notes={accountNotes}
                clinicName={account.clinic_name}
                pinnedIds={accountPinnedIds}
                onUpdateNote={async (noteId, content) => {
                  const { error } = await supabase.from('opportunity_notes').update({ content }).eq('id', noteId);
                  if (error) { toast.error('แก้ไขไม่สำเร็จ'); return; }
                  setAccountNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
                  toast.success('แก้ไขบันทึกแล้ว');
                }}
                onDeleteNote={async (noteId) => {
                  const { error } = await supabase.from('opportunity_notes').delete().eq('id', noteId);
                  if (error) { toast.error('ลบไม่สำเร็จ'); return; }
                  setAccountNotes(prev => prev.filter(n => n.id !== noteId));
                  toast.success('ลบบันทึกแล้ว');
                }}
                onPinNote={async (noteId) => {
                  const note = accountNotes.find(n => n.id === noteId);
                  if (!note) return;
                  const newPinned = !note.is_pinned;
                  const { error } = await supabase.from('opportunity_notes').update({ is_pinned: newPinned }).eq('id', noteId);
                  if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
                  setAccountNotes(prev => prev.map(n => n.id === noteId ? { ...n, is_pinned: newPinned } : n));
                  setAccountPinnedIds(prev => {
                    const next = new Set(prev);
                    if (newPinned) next.add(noteId); else next.delete(noteId);
                    return next;
                  });
                  toast.success(newPinned ? 'ปักหมุดแล้ว' : 'ยกเลิกปักหมุดแล้ว');
                }}
                onDeleteActivity={async (actId) => {
                  const { error } = await supabase.from('activities').delete().eq('id', actId);
                  if (error) { toast.error('ลบกิจกรรมไม่สำเร็จ'); return; }
                  setAccountActivities(prev => prev.filter(a => a.id !== actId));
                  toast.success('ลบกิจกรรมแล้ว');
                }}
                onUpdateActivity={(updated) => {
                  setAccountActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
                }}
                onAddComment={async (parentId, comment) => {
                  const { data, error } = await supabase.from('opportunity_notes').insert({
                    opportunity_id: accountActivities.find(a => a.id === parentId)?.opportunity_id || opportunities[0]?.id || '',
                    account_id: id!,
                    content: comment,
                    created_by: 'Me',
                    parent_id: parentId,
                  }).select().single();
                  if (error) { toast.error('เพิ่มความคิดเห็นไม่สำเร็จ'); return; }
                  setAccountNotes(prev => [data as unknown as OpportunityNote, ...prev]);
                  toast.success('เพิ่มความคิดเห็นแล้ว');
                }}
              />
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
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-3"><MapPin size={12} /> บันทึกการเยี่ยม ({visitReports.length})</p>
                <div className="space-y-3">
                  {visitReports.map(r => (
                    <div key={r.id} className="rounded-md bg-muted/30 border overflow-hidden flex flex-col md:flex-row">
                      {r.photo && (
                        <div className="md:w-1/3 shrink-0">
                          <img src={r.photo} alt="check-in" className="w-full h-full aspect-square object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {r.check_in_at ? format(new Date(r.check_in_at), 'd MMM yyyy HH:mm', { locale: th }) : '-'}
                          </span>
                          <Badge variant={r.status === 'REPORTED' ? 'default' : 'secondary'} className="text-[10px] h-5">
                            {r.status === 'REPORTED' ? 'รายงานแล้ว' : 'รอกรอกรายงาน'}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {r.met_who && <p><span className="text-muted-foreground">พบ:</span> <span className="text-foreground">{r.met_who}</span></p>}
                          {r.action && <p><span className="text-muted-foreground">สิ่งที่ทำ:</span> <span className="text-foreground">{r.action}</span></p>}
                          {r.devices_in_use && <p><span className="text-muted-foreground">เครื่องมือ:</span> <span className="text-foreground">{r.devices_in_use}</span></p>}
                          {r.issues && <p><span className="text-muted-foreground">ปัญหา:</span> <span className="text-foreground">{r.issues}</span></p>}
                          {r.next_plan && <p className="text-primary">ถัดไป: {r.next_plan}</p>}
                          {r.customer_type && (
                            <p><span className="text-muted-foreground">ผลเยี่ยม:</span> <span className="text-foreground">
                              {r.customer_type === 'INTERESTED' ? 'สนใจ' : r.customer_type === 'NOT_INTERESTED' ? 'ไม่สนใจ' : 'ลูกค้าเก่า'}
                            </span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {visitReports.length === 0 && <Empty text="ยังไม่มีบันทึกการเยี่ยม" />}
                </div>
              </div>
            </TabsContent>


            {/* ===== DEMO REPORTS (รายงานเคส DEMO) ===== */}
            <TabsContent value="demo-reports" className="mt-0 space-y-4">
              {demoReports.map(demo => {
                const report = demo.report_data as Record<string, any> | null;
                const deviceNames = Object.keys(report || {});
                return (
                  <div key={demo.id} className="p-4 rounded-md bg-muted/30 border space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Presentation size={14} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {demo.demo_date ? format(new Date(demo.demo_date), 'd MMM yyyy', { locale: th }) : '-'}
                        </span>
                      </div>
                      <Badge variant="default" className="text-[10px] h-5">เสร็จแล้ว</Badge>
                    </div>
                    {demo.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={11} />{demo.location}</p>
                    )}
                    {demo.products_demo && demo.products_demo.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {demo.products_demo.map((p: string) => (
                          <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                        ))}
                      </div>
                    )}
                    {deviceNames.length > 0 ? deviceNames.map(deviceName => {
                      const devData = report![deviceName];
                      const patients = devData?.patients || (Array.isArray(devData) ? devData : []);
                      return (
                        <div key={deviceName} className="space-y-2 border-t pt-2">
                          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Monitor size={12} /> {deviceName}
                            <span className="text-muted-foreground font-normal">({patients.length} คนไข้)</span>
                          </h4>
                          {patients.map((pt: any, idx: number) => (
                            <div key={idx} className="ml-3 p-3 rounded bg-background border space-y-1.5">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <Users size={11} /> คนไข้ #{idx + 1}
                              </p>
                              {pt.parameters && (
                                <p className="text-xs"><span className="text-muted-foreground">Parameters:</span> <span className="text-foreground">{pt.parameters}</span></p>
                              )}
                              {pt.feeling && (
                                <p className="text-xs"><span className="text-muted-foreground">Feeling:</span> <span className="text-foreground">{pt.feeling}</span></p>
                              )}
                              {pt.painScore !== undefined && pt.painScore !== null && (
                                <div className="text-xs flex items-center gap-1.5">
                                  <span className="text-muted-foreground">Pain Score:</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{
                                        width: `${(pt.painScore / 10) * 100}%`,
                                        backgroundColor: pt.painScore <= 3 ? 'hsl(var(--primary))' : pt.painScore <= 6 ? 'hsl(40,90%,50%)' : 'hsl(0,70%,50%)'
                                      }} />
                                    </div>
                                    <span className="font-semibold text-foreground">{pt.painScore}/10</span>
                                  </div>
                                </div>
                              )}
                              {pt.satisfaction && (
                                <p className="text-xs"><span className="text-muted-foreground">Satisfaction:</span> <span className="text-foreground">{pt.satisfaction}</span></p>
                              )}
                              {pt.sideEffects && pt.sideEffects.length > 0 && (
                                <div className="text-xs flex items-center gap-1 flex-wrap">
                                  <span className="text-muted-foreground">ผลข้างเคียง:</span>
                                  {(Array.isArray(pt.sideEffects) ? pt.sideEffects : [pt.sideEffects]).map((se: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-[10px]">{se}</Badge>
                                  ))}
                                </div>
                              )}
                              {pt.presentationNotes && (
                                <p className="text-xs"><span className="text-muted-foreground">สิ่งที่นำเสนอ:</span> <span className="text-foreground">{pt.presentationNotes}</span></p>
                              )}
                              {pt.presentation && (
                                <p className="text-xs"><span className="text-muted-foreground">สิ่งที่นำเสนอ:</span> <span className="text-foreground">{pt.presentation}</span></p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-muted-foreground">ไม่มีข้อมูลรายงาน</p>
                    )}
                    {demo.demo_note && (
                      <p className="text-xs text-muted-foreground border-t pt-2">หมายเหตุ: {demo.demo_note}</p>
                    )}
                  </div>
                );
              })}
              {demoReports.length === 0 && <Empty text="ยังไม่มีรายงานเคส DEMO" />}
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
                {/* Approved Quotation PDFs */}
                {qtDocs.map(q => (
                  <button
                    key={q.id}
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('generate-quotation-pdf', {
                          body: { quotation_id: q.id },
                        });
                        if (error) throw error;
                        // data is raw HTML string when Content-Type is text/html
                        const html = typeof data === 'string' ? data : data?.html;
                        if (html) {
                          const w = window.open('', '_blank');
                          if (w) { w.document.write(html); w.document.close(); }
                        } else {
                          toast.error('ไม่พบข้อมูล PDF');
                        }
                      } catch (e) {
                        toast.error('ไม่สามารถสร้าง PDF ได้');
                      }
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/40 transition-colors cursor-pointer w-full text-left"
                  >
                    <span className="text-base">📋</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs text-foreground truncate">{q.qt_number || 'ใบเสนอราคา'} — {q.product || ''}</p>
                        {q.customer_signed_at && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-600">CUSTOMER SIGNED</span>
                        )}
                        {q.payment_status && q.payment_status !== 'PAID' && (
                          <StatusBadge status={q.payment_status} className="text-[10px] px-1.5 py-0.5" />
                        )}
                        {q.payment_status === 'PAID' && (
                          <StatusBadge status="PAID" className="text-[10px] px-1.5 py-0.5" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        ใบเสนอราคา (อนุมัติแล้ว) • {q.qt_date || '-'} • ฿{(q.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <FileText size={12} className="text-muted-foreground shrink-0" />
                  </button>
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
                {documents.length === 0 && qtDocs.length === 0 && <Empty text="ไม่มีเอกสาร" />}
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

            {/* ===== CHAT IMAGES ===== */}
            <TabsContent value="chat_images" className="mt-0">
              {chatImages.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {chatImages.map(img => (
                      <a key={img.id} href={img.file_url} target="_blank" rel="noopener noreferrer" className="group block">
                        <div className="aspect-square rounded-lg border border-border overflow-hidden bg-muted/30 hover:border-primary/50 transition-colors">
                          <img src={img.file_url} alt={img.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="mt-1.5">
                          <p className="text-[10px] text-muted-foreground truncate">{img.uploaded_by || '-'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(img.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty text="ยังไม่มีรูปแชท — อัปโหลดผ่าน AI สรุปแชท ในหน้าโอกาสขาย" />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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
              <Label>เลขประจำตัวผู้เสียภาษี</Label>
              <Input value={editForm.tax_id || ''} onChange={e => setEditForm(f => ({ ...f, tax_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทนิติบุคคล</Label>
              <Select value={editForm.entity_type || ''} onValueChange={v => setEditForm(f => ({ ...f, entity_type: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {['บุคคลธรรมดา', 'นิติบุคคล', 'คลินิก', 'โรงพยาบาล'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทสาขา</Label>
              <Select value={editForm.branch_type || ''} onValueChange={v => setEditForm(f => ({ ...f, branch_type: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {['สำนักงานใหญ่', 'สาขา'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>โทรศัพท์คลินิก</Label>
              <Input value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input type="email" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label>เครื่องที่มีอยู่แล้ว</Label>
              <Textarea value={editForm.current_devices || ''} onChange={e => setEditForm(f => ({ ...f, current_devices: e.target.value }))} rows={2} placeholder="พิมพ์ชื่อเครื่องที่ลูกค้ามีอยู่..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSubmit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ติดต่อ</DialogTitle>
            <DialogDescription>เพิ่มข้อมูลผู้ติดต่อใหม่สำหรับลูกค้านี้</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อ *</Label>
              <Input value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} placeholder="ชื่อผู้ติดต่อ" />
            </div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง</Label>
              <Input value={newContact.role} onChange={e => setNewContact(c => ({ ...c, role: e.target.value }))} placeholder="เช่น Owner, Doctor" />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} placeholder="08x-xxx-xxxx" />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input value={newContact.email} onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))} placeholder="email@example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContactOpen(false)}>ยกเลิก</Button>
            <Button onClick={async () => {
              if (!newContact.name.trim()) { toast.error('กรุณากรอกชื่อผู้ติดต่อ'); return; }
              const { error } = await supabase.from('contacts').insert({
                account_id: account.id,
                name: newContact.name.trim(),
                role: newContact.role.trim() || null,
                phone: newContact.phone.trim() || null,
                email: newContact.email.trim() || null,
              });
              if (error) { toast.error('เพิ่มผู้ติดต่อไม่สำเร็จ'); return; }
              toast.success('เพิ่มผู้ติดต่อสำเร็จ');
              setAddContactOpen(false);
              // Refresh contacts
              const { data } = await supabase.from('contacts').select('*').eq('account_id', account.id);
              if (data) setContacts(data as unknown as LocalContact[]);
            }}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Contact Dialog */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขผู้ติดต่อ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลผู้ติดต่อ</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อ *</Label>
              <Input value={editContactForm.name} onChange={e => setEditContactForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ตำแหน่ง</Label>
              <Input value={editContactForm.role} onChange={e => setEditContactForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input value={editContactForm.phone} onChange={e => setEditContactForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input value={editContactForm.email} onChange={e => setEditContactForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactOpen(false)}>ยกเลิก</Button>
            <Button onClick={async () => {
              if (!editingContact || !editContactForm.name.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
              const { error } = await supabase.from('contacts').update({
                name: editContactForm.name.trim(),
                role: editContactForm.role.trim() || null,
                phone: editContactForm.phone.trim() || null,
                email: editContactForm.email.trim() || null,
              }).eq('id', editingContact.id);
              if (error) { toast.error('แก้ไขไม่สำเร็จ'); return; }
              setContacts(prev => prev.map(c => c.id === editingContact.id ? { ...c, name: editContactForm.name.trim(), role: editContactForm.role.trim() || null, phone: editContactForm.phone.trim() || null, email: editContactForm.email.trim() || null } : c));
              toast.success('แก้ไขผู้ติดต่อสำเร็จ');
              setEditContactOpen(false);
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

function InfoItem({ label, value, isPhone }: { label: string; value: string | null; isPhone?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-1.5 text-xs">
      <span className="text-muted-foreground shrink-0 min-w-[80px]">{label}</span>
      {isPhone ? (
        <a href={`tel:${value}`} className="text-foreground hover:text-primary">{value}</a>
      ) : (
        <span className="text-foreground">{value}</span>
      )}
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

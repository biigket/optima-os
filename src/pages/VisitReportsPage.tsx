import { useState, useEffect } from 'react';
import { FileText, Building2, User, Clock, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMockAuth, useCanSeeAll, useSalesUsers } from '@/hooks/useMockAuth';

interface VisitReport {
  id: string;
  account_id: string | null;
  clinic_name: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string | null;
  action: string | null;
  met_who: string | null;
  devices_in_use: string | null;
  issues: string | null;
  next_plan: string | null;
  customer_type: string | null;
  new_contact_name: string | null;
  new_contact_phone: string | null;
  photo: string | null;
  created_at: string;
  created_by: string | null;
  accounts?: { id: string; clinic_name: string } | null;
}

const CUSTOMER_TYPES = [
  { value: 'NOT_INTERESTED', label: 'ไม่สนใจ' },
  { value: 'INTERESTED', label: 'สนใจ - สร้างโอกาสขาย' },
  { value: 'EXISTING', label: 'ลูกค้าเก่า - ติดตาม' },
];

export default function VisitReportsPage() {
  const { currentUser } = useMockAuth();
  const canSeeAll = useCanSeeAll();
  const salesUsers = useSalesUsers();
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [editingReport, setEditingReport] = useState<VisitReport | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Form state
  const [action, setAction] = useState('');
  const [metWho, setMetWho] = useState('');
  const [devicesInUse, setDevicesInUse] = useState('');
  const [issues, setIssues] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  useEffect(() => { fetchReports(); }, [filterUser]);

  useEffect(() => {
    // Auto-open form if coming from check-in
    const planId = searchParams.get('plan');
    const accountId = searchParams.get('account');
    if (planId && accountId) {
      openFormForAccount(accountId, planId);
    }
  }, [searchParams]);

  async function fetchReports() {
    setLoading(true);
    let query = supabase
      .from('visit_reports')
      .select('*, accounts(id, clinic_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!canSeeAll && currentUser) {
      query = query.eq('created_by', currentUser.name);
    }
    const { data } = await query;
    if (data) setReports(data as unknown as VisitReport[]);
    setLoading(false);
  }

  async function fetchAccountDevices(accountId: string): Promise<string> {
    const { data } = await supabase
      .from('accounts')
      .select('current_devices')
      .eq('id', accountId)
      .single();
    return data?.current_devices || '';
  }

  async function openFormForAccount(accountId: string, planId: string) {
    // Find the report linked to this plan
    const { data: plans } = await supabase
      .from('visit_plans')
      .select('visit_report_id')
      .eq('id', planId)
      .single();

    if (plans?.visit_report_id) {
      const { data: report } = await supabase
        .from('visit_reports')
        .select('*, accounts(id, clinic_name)')
        .eq('id', plans.visit_report_id)
        .single();
      if (report) {
        const r = report as unknown as VisitReport;
        const accountDevices = r.account_id ? await fetchAccountDevices(r.account_id) : '';
        setEditingReport(r);
        setAction(r.action || '');
        setMetWho(r.met_who || '');
        setDevicesInUse(r.devices_in_use || accountDevices);
        setIssues(r.issues || '');
        setNextPlan(r.next_plan || '');
        setCustomerType(r.customer_type || '');
        setNewContactName(r.new_contact_name || '');
        setNewContactPhone(r.new_contact_phone || '');
        setFormOpen(true);
      }
    }
  }

  async function handleSaveReport() {
    if (!editingReport) return;

    const { error } = await supabase.from('visit_reports').update({
      action,
      met_who: metWho,
      devices_in_use: devicesInUse,
      issues,
      next_plan: nextPlan,
      customer_type: customerType,
      new_contact_name: newContactName,
      new_contact_phone: newContactPhone,
      check_out_at: new Date().toISOString(),
      status: 'REPORTED',
    }).eq('id', editingReport.id);

    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }

    // Sync devices_in_use back to account's current_devices
    if (editingReport.account_id && devicesInUse.trim()) {
      await supabase.from('accounts').update({
        current_devices: devicesInUse.trim(),
      }).eq('id', editingReport.account_id);
    }

    // Update plan status
    await supabase.from('visit_plans')
      .update({ status: 'REPORTED' })
      .eq('visit_report_id', editingReport.id);

    toast.success('บันทึกรายงานแล้ว');
    setFormOpen(false);
    setEditingReport(null);
    fetchReports();

    // If interested, navigate to create opportunity
    if (customerType === 'INTERESTED' && editingReport.account_id) {
      navigate(`/opportunities?create=true&accountId=${editingReport.account_id}`);
    }
  }

  async function openReport(report: VisitReport) {
    const accountDevices = report.account_id ? await fetchAccountDevices(report.account_id) : '';
    setEditingReport(report);
    setAction(report.action || '');
    setMetWho(report.met_who || '');
    setDevicesInUse(report.devices_in_use || accountDevices);
    setIssues(report.issues || '');
    setNextPlan(report.next_plan || '');
    setCustomerType(report.customer_type || '');
    setNewContactName(report.new_contact_name || '');
    setNewContactPhone(report.new_contact_phone || '');
    setFormOpen(true);
  }

  const statusColor = (s: string | null) => {
    if (s === 'REPORTED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'CHECKED_IN') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-muted text-muted-foreground';
  };
  const statusLabel = (s: string | null) => {
    if (s === 'REPORTED') return 'รายงานแล้ว';
    if (s === 'CHECKED_IN') return 'เช็คอินแล้ว';
    return s || '-';
  };

  function renderReportList(list: VisitReport[]) {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText size={40} className="mx-auto mb-2 opacity-40" />
          <p>ไม่มีรายงาน</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map(report => (
          <div
            key={report.id}
            className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => openReport(report)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{report.clinic_name || report.accounts?.clinic_name || '-'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  {canSeeAll && report.created_by && <span className="flex items-center gap-1">👤 {report.created_by}</span>}
                  {report.met_who && <span className="flex items-center gap-1"><User size={12} /> {report.met_who}</span>}
                  {report.check_in_at && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {format(new Date(report.check_in_at), 'd MMM HH:mm', { locale: th })}
                    </span>
                  )}
                </div>
              </div>
              <Badge className={statusColor(report.status)}>{statusLabel(report.status)}</Badge>
            </div>
            {report.action && <p className="text-sm text-muted-foreground">{report.action}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">รายงานเยี่ยมลูกค้า</h1>
        <p className="text-sm text-muted-foreground">สรุปผลการเข้าเยี่ยมลูกค้า</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              ยังไม่รายงาน ({reports.filter(r => r.status !== 'REPORTED').length})
            </TabsTrigger>
            <TabsTrigger value="reported" className="flex-1">
              รายงานแล้ว ({reports.filter(r => r.status === 'REPORTED').length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {renderReportList(reports.filter(r => r.status !== 'REPORTED'))}
          </TabsContent>
          <TabsContent value="reported">
            {renderReportList(reports.filter(r => r.status === 'REPORTED'))}
          </TabsContent>
        </Tabs>
      )}

      {/* Report Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายงานเยี่ยมลูกค้า: {editingReport?.clinic_name || editingReport?.accounts?.clinic_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Check-in Photo */}
            {editingReport?.photo && (
              <div>
                <label className="text-sm font-medium text-foreground">📷 รูปเช็คอิน</label>
                <img
                  src={editingReport.photo}
                  alt="Check-in photo"
                  className="w-full rounded-lg border mt-1.5 aspect-[4/3] object-cover"
                />
                {editingReport.check_in_at && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock size={12} /> เช็คอินเมื่อ {format(new Date(editingReport.check_in_at), 'd MMM yyyy HH:mm', { locale: th })}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">พบใคร</label>
              <Input value={metWho} onChange={e => setMetWho(e.target.value)} placeholder="ชื่อคนที่พบ" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">สิ่งที่ทำ</label>
              <Textarea value={action} onChange={e => setAction(e.target.value)} placeholder="อธิบายสิ่งที่ทำระหว่างเยี่ยม" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">เครื่องมือที่ใช้อยู่</label>
              <Input value={devicesInUse} onChange={e => setDevicesInUse(e.target.value)} placeholder="เครื่องมือที่คลินิกมีอยู่" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ปัญหา/ข้อกังวล</label>
              <Textarea value={issues} onChange={e => setIssues(e.target.value)} placeholder="ปัญหาหรือข้อกังวลจากลูกค้า" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">แผนถัดไป</label>
              <Textarea value={nextPlan} onChange={e => setNextPlan(e.target.value)} placeholder="สิ่งที่จะทำต่อ" rows={2} />
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-foreground">ผลการเยี่ยม</label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger><SelectValue placeholder="เลือกผลการเยี่ยม" /></SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {customerType === 'INTERESTED' && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-3 space-y-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-1.5">
                  <Target size={14} /> บันทึกแล้วจะนำไปสร้างโอกาสขาย
                </p>
                <div>
                  <label className="text-xs font-medium text-foreground">ชื่อผู้ติดต่อใหม่</label>
                  <Input value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="ชื่อ" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">เบอร์โทร</label>
                  <Input value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} placeholder="เบอร์โทร" />
                </div>
              </div>
            )}

            <Button onClick={handleSaveReport} className="w-full gap-1.5">
              <FileText size={14} /> บันทึกรายงาน
              {customerType === 'INTERESTED' && ' → สร้างโอกาสขาย'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

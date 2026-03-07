import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Plus, Building2, Trash2, UserPlus, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

const VISIT_TYPE_LABELS: Record<string, string> = { NEW: 'ลูกค้าใหม่', EXISTING: 'ลูกค้าเก่า' };
const STATUS_LABELS: Record<string, string> = { PLANNED: 'วางแผน', CHECKED_IN: 'เช็คอินแล้ว', REPORTED: 'รายงานแล้ว' };
const STATUS_COLORS: Record<string, string> = { PLANNED: 'bg-muted text-muted-foreground', CHECKED_IN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', REPORTED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
const DAY_NAMES = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

interface VisitPlan {
  id: string;
  plan_date: string;
  account_id: string;
  visit_type: string;
  status: string;
  notes: string | null;
  visit_report_id: string | null;
  accounts?: { id: string; clinic_name: string; customer_status: string } | null;
}

interface Account {
  id: string;
  clinic_name: string;
  customer_status: string;
}

export default function WeeklyPlanPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState('');
  const [addAccountId, setAddAccountId] = useState('');
  const [addType, setAddType] = useState('NEW');

  const weekStart = useMemo(() => {
    const now = new Date();
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    return addDays(ws, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  useEffect(() => {
    // Reset to Monday when week changes
    setSelectedDay(weekStart);
  }, [weekStart]);

  useEffect(() => {
    fetchData();
  }, [weekStart]);

  async function fetchData() {
    setLoading(true);
    const startDate = format(weekStart, 'yyyy-MM-dd');
    const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const [plansRes, accountsRes] = await Promise.all([
      supabase.from('visit_plans').select('*, accounts(id, clinic_name, customer_status)').gte('plan_date', startDate).lte('plan_date', endDate).order('created_at'),
      supabase.from('accounts').select('id, clinic_name, customer_status').order('clinic_name'),
    ]);

    if (plansRes.data) setPlans(plansRes.data as unknown as VisitPlan[]);
    if (accountsRes.data) setAccounts(accountsRes.data);
    setLoading(false);
  }

  const dayPlans = useMemo(() =>
    plans.filter(p => isSameDay(new Date(p.plan_date + 'T00:00:00'), selectedDay)),
    [plans, selectedDay]
  );

  const newCount = dayPlans.filter(p => p.visit_type === 'NEW').length;
  const existingCount = dayPlans.filter(p => p.visit_type === 'EXISTING').length;

  async function handleAdd() {
    if (!addAccountId || !addDate) return;
    const { error } = await supabase.from('visit_plans').insert({
      plan_date: addDate,
      account_id: addAccountId,
      visit_type: addType,
    });
    if (error) { toast.error('เพิ่มไม่สำเร็จ'); return; }
    toast.success('เพิ่มแผนเยี่ยมแล้ว');
    setAddOpen(false);
    setAddAccountId('');
    fetchData();
  }

  async function handleRemove(id: string) {
    await supabase.from('visit_plans').delete().eq('id', id);
    toast.success('ลบแผนแล้ว');
    fetchData();
  }

  // Filter accounts not already planned for this day
  const plannedAccountIds = dayPlans.map(p => p.account_id);
  const availableAccounts = accounts.filter(a => !plannedAccountIds.includes(a.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แผนเยี่ยมรายสัปดาห์</h1>
          <p className="text-sm text-muted-foreground">วางแผนเข้าเยี่ยมลูกค้า</p>
        </div>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(o => o - 1)}><ChevronLeft size={16} /></Button>
        <div className="text-sm font-medium text-foreground">
          {format(weekStart, 'd MMM', { locale: th })} – {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: th })}
        </div>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(o => o + 1)}><ChevronRight size={16} /></Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>สัปดาห์นี้</Button>
        )}
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());
          const count = plans.filter(p => isSameDay(new Date(p.plan_date + 'T00:00:00'), day)).length;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs font-medium transition-colors min-w-[72px] ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isToday
                    ? 'bg-accent/20 border-accent text-foreground'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <span>{DAY_NAMES[i]}</span>
              <span className="text-[10px]">{format(day, 'd MMM', { locale: th })}</span>
              {count > 0 && <span className={`mt-0.5 text-[10px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{count} นัด</span>}
            </button>
          );
        })}
      </div>

      {/* Day summary */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          {format(selectedDay, 'EEEE d MMMM', { locale: th })}
        </h2>
      </div>

      {/* Plans list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
        ) : dayPlans.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays size={40} className="mx-auto mb-2 opacity-40" />
            <p>ยังไม่มีแผนเยี่ยมสำหรับวันนี้</p>
          </div>
        ) : (
          dayPlans.map(plan => (
            <div key={plan.id} className="rounded-lg border bg-card p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                plan.visit_type === 'NEW' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {plan.visit_type === 'NEW' ? <UserPlus size={20} /> : <Users size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground shrink-0" />
                  <p className="text-sm font-semibold text-foreground truncate">{plan.accounts?.clinic_name || '-'}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{VISIT_TYPE_LABELS[plan.visit_type]}</Badge>
                  <Badge className={`text-[10px] ${STATUS_COLORS[plan.status]}`}>{STATUS_LABELS[plan.status]}</Badge>
                </div>
              </div>
              {plan.status === 'PLANNED' && (
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemove(plan.id)}>
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add button */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5" onClick={() => { setAddDate(format(selectedDay, 'yyyy-MM-dd')); setAddOpen(true); }}>
            <Plus size={14} /> เพิ่มแผนเยี่ยม
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มแผนเยี่ยมลูกค้า</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">วันที่</label>
              <p className="text-sm text-muted-foreground">{format(selectedDay, 'EEEE d MMMM yyyy', { locale: th })}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ประเภท</label>
              <Select value={addType} onValueChange={setAddType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">ลูกค้าใหม่</SelectItem>
                  <SelectItem value="EXISTING">ลูกค้าเก่า</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">ลูกค้า</label>
              <Select value={addAccountId} onValueChange={setAddAccountId}>
                <SelectTrigger><SelectValue placeholder="เลือกลูกค้า" /></SelectTrigger>
                <SelectContent>
                  {availableAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.clinic_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={!addAccountId} className="w-full">เพิ่ม</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

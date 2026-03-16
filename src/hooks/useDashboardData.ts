import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardKpis {
  // Sales
  newLeads: number;
  activeOpps: number;
  pipelineValue: number;
  wonThisMonth: number;
  wonValue: number;
  // Operations
  pendingDemos: number;
  confirmedDemos: number;
  pendingQuotations: number;
  approvedQuotations: number;
  // Service
  totalInstalled: number;
  overduePM: number;
  activeContracts: number;
  // Finance
  totalDue: number;
  totalPaid: number;
  pendingSlips: number;
  overduePayments: number;
  // Visit
  plannedVisits: number;
  completedVisits: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  value: number;
}

interface UpcomingActivity {
  id: string;
  title: string;
  activity_type: string;
  activity_date: string;
  start_time?: string;
  clinic_name?: string;
  is_done: boolean;
}

interface UpcomingDemo {
  id: string;
  demo_date: string;
  clinic_name?: string;
  products_demo?: string[];
  confirmed: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  created_by?: string;
  created_at: string;
}

export function useDashboardData() {
  const [kpis, setKpis] = useState<DashboardKpis>({
    newLeads: 0, activeOpps: 0, pipelineValue: 0, wonThisMonth: 0, wonValue: 0,
    pendingDemos: 0, confirmedDemos: 0, pendingQuotations: 0, approvedQuotations: 0,
    totalInstalled: 0, overduePM: 0, activeContracts: 0,
    totalDue: 0, totalPaid: 0, pendingSlips: 0, overduePayments: 0,
    plannedVisits: 0, completedVisits: 0,
  });
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<UpcomingActivity[]>([]);
  const [upcomingDemos, setUpcomingDemos] = useState<UpcomingDemo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    const [
      accountsRes, oppsRes, demosRes, quotationsRes,
      installationsRes, maintenanceRes, contractsRes,
      installmentsRes, visitPlansRes, visitReportsRes,
      activitiesRes, announcementsRes,
    ] = await Promise.all([
      supabase.from('accounts').select('id, customer_status'),
      supabase.from('opportunities').select('id, stage, expected_value, created_at'),
      supabase.from('demos').select('id, demo_date, confirmed, account_id, products_demo').order('demo_date', { ascending: true }),
      supabase.from('quotations').select('id, approval_status, price, payment_status'),
      supabase.from('installations').select('id, status'),
      supabase.from('maintenance_records').select('id, status, scheduled_date'),
      supabase.from('contracts').select('id, status'),
      supabase.from('payment_installments').select('id, amount, slip_status, due_date, paid_date'),
      supabase.from('visit_plans').select('id, status, plan_date'),
      supabase.from('visit_reports').select('id, status'),
      supabase.from('activities').select('id, title, activity_type, activity_date, start_time, is_done, account_id').gte('activity_date', today).order('activity_date', { ascending: true }).limit(10),
      supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(20),
    ]);

    const accounts = accountsRes.data || [];
    const opps = oppsRes.data || [];
    const demos = demosRes.data || [];
    const quotations = quotationsRes.data || [];
    const installations = installationsRes.data || [];
    const maintenance = maintenanceRes.data || [];
    const contracts = contractsRes.data || [];
    const installments = installmentsRes.data || [];
    const visitPlans = visitPlansRes.data || [];
    const activities = activitiesRes.data || [];
    const anns = announcementsRes.data || [];

    // Fetch clinic names for activities
    const actAccountIds = [...new Set(activities.map(a => a.account_id))];
    let accountMap: Record<string, string> = {};
    if (actAccountIds.length > 0) {
      const { data: actAccounts } = await supabase.from('accounts').select('id, clinic_name').in('id', actAccountIds);
      (actAccounts || []).forEach(a => { accountMap[a.id] = a.clinic_name; });
    }

    // Fetch clinic names for demos
    const demoAccountIds = [...new Set(demos.filter(d => d.account_id).map(d => d.account_id!))];
    if (demoAccountIds.length > 0) {
      const { data: demoAccounts } = await supabase.from('accounts').select('id, clinic_name').in('id', demoAccountIds);
      (demoAccounts || []).forEach(a => { accountMap[a.id] = a.clinic_name; });
    }

    // KPIs
    const activeStages = opps.filter(o => !['WON', 'LOST'].includes(o.stage));
    const wonThisMonth = opps.filter(o => o.stage === 'WON' && o.created_at >= monthStart);

    setKpis({
      newLeads: accounts.filter(a => a.customer_status === 'NEW_LEAD').length,
      activeOpps: activeStages.length,
      pipelineValue: activeStages.reduce((s, o) => s + (o.expected_value || 0), 0),
      wonThisMonth: wonThisMonth.length,
      wonValue: wonThisMonth.reduce((s, o) => s + (o.expected_value || 0), 0),
      pendingDemos: demos.filter(d => !d.confirmed && d.demo_date && d.demo_date >= today).length,
      confirmedDemos: demos.filter(d => d.confirmed && d.demo_date && d.demo_date >= today).length,
      pendingQuotations: quotations.filter(q => q.approval_status === 'SUBMITTED').length,
      approvedQuotations: quotations.filter(q => q.approval_status === 'APPROVED' || q.approval_status === 'CUSTOMER_SIGNED').length,
      totalInstalled: installations.filter(i => i.status === 'ACTIVE').length,
      overduePM: maintenance.filter(m => m.status === 'PENDING' && m.scheduled_date && m.scheduled_date < today).length,
      activeContracts: contracts.filter(c => c.status === 'SIGNED' || c.status === 'DRAFT').length,
      totalDue: installments.filter(i => !i.paid_date).reduce((s, i) => s + (i.amount || 0), 0),
      totalPaid: installments.filter(i => i.paid_date).reduce((s, i) => s + (i.amount || 0), 0),
      pendingSlips: installments.filter(i => i.slip_status === 'PENDING').length,
      overduePayments: installments.filter(i => !i.paid_date && i.due_date && i.due_date < today).length,
      plannedVisits: visitPlans.filter(v => v.status === 'PLANNED').length,
      completedVisits: (visitReportsRes.data || []).length,
    });

    // Pipeline stages
    const stageOrder = ['NEW_LEAD', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_DONE', 'NEGOTIATION', 'FOLLOW_UP', 'WAITING_APPROVAL', 'COMPARING'];
    const stageMap: Record<string, { count: number; value: number }> = {};
    stageOrder.forEach(s => { stageMap[s] = { count: 0, value: 0 }; });
    activeStages.forEach(o => {
      if (stageMap[o.stage]) {
        stageMap[o.stage].count++;
        stageMap[o.stage].value += (o.expected_value || 0);
      }
    });
    setPipelineStages(stageOrder.map(s => ({ stage: s, ...stageMap[s] })).filter(s => s.count > 0));

    // Upcoming activities
    setUpcomingActivities(activities.filter(a => !a.is_done).slice(0, 8).map(a => ({
      ...a,
      is_done: a.is_done ?? false,
      clinic_name: accountMap[a.account_id],
    })));

    // Upcoming demos
    setUpcomingDemos(demos.filter(d => d.demo_date && d.demo_date >= today).slice(0, 6).map(d => ({
      id: d.id,
      demo_date: d.demo_date!,
      clinic_name: d.account_id ? accountMap[d.account_id] : undefined,
      products_demo: d.products_demo ?? undefined,
      confirmed: d.confirmed,
    })));

    setAnnouncements(anns as Announcement[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  return { kpis, pipelineStages, upcomingActivities, upcomingDemos, announcements, loading, refetch: fetchAll };
}

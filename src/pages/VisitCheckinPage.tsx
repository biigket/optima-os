import { useState, useEffect } from 'react';
import { MapPin, Clock, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface VisitPlan {
  id: string;
  plan_date: string;
  account_id: string;
  visit_type: string;
  status: string;
  accounts?: { id: string; clinic_name: string } | null;
}

export default function VisitCheckinPage() {
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const navigate = useNavigate();

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    setLoading(true);
    const { data } = await supabase
      .from('visit_plans')
      .select('*, accounts(id, clinic_name)')
      .eq('plan_date', today)
      .order('created_at');
    if (data) setPlans(data as unknown as VisitPlan[]);
    setLoading(false);
  }

  async function handleCheckin(plan: VisitPlan) {
    setCheckingIn(plan.id);

    // Create visit report
    const { data: report, error } = await supabase.from('visit_reports').insert({
      account_id: plan.account_id,
      clinic_name: plan.accounts?.clinic_name || '',
      check_in_at: new Date().toISOString(),
      status: 'CHECKED_IN',
    }).select('id').single();

    if (error) { toast.error('เช็คอินไม่สำเร็จ'); setCheckingIn(null); return; }

    // Update plan status
    await supabase.from('visit_plans').update({
      status: 'CHECKED_IN',
      visit_report_id: report.id,
    }).eq('id', plan.id);

    toast.success(`เช็คอินที่ ${plan.accounts?.clinic_name} แล้ว`);
    setCheckingIn(null);
    fetchPlans();
  }

  function goToReport(plan: VisitPlan) {
    navigate(`/visit-reports?plan=${plan.id}&account=${plan.account_id}`);
  }

  const planned = plans.filter(p => p.status === 'PLANNED');
  const checkedIn = plans.filter(p => p.status === 'CHECKED_IN');
  const reported = plans.filter(p => p.status === 'REPORTED');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">เช็คอินเยี่ยมลูกค้า</h1>
        <p className="text-sm text-muted-foreground">วันนี้ {format(new Date(), 'd MMMM yyyy', { locale: th })}</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin size={40} className="mx-auto mb-2 opacity-40" />
          <p>ไม่มีแผนเยี่ยมวันนี้</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/weekly-plan')}>ไปวางแผน</Button>
        </div>
      ) : (
        <>
          {/* Pending check-in */}
          {planned.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">รอเช็คอิน ({planned.length})</h2>
              {planned.map(plan => (
                <div key={plan.id} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-1">{plan.visit_type === 'NEW' ? 'ลูกค้าใหม่' : 'ลูกค้าเก่า'}</Badge>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0"
                    disabled={checkingIn === plan.id}
                    onClick={() => handleCheckin(plan)}
                  >
                    <MapPin size={14} /> เช็คอิน
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Checked in - go to report */}
          {checkedIn.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">เช็คอินแล้ว - รอกรอกรายงาน ({checkedIn.length})</h2>
              {checkedIn.map(plan => (
                <div key={plan.id} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock size={12} /> เช็คอินแล้ว
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    onClick={() => goToReport(plan)}
                  >
                    กรอกรายงาน <ArrowRight size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Reported */}
          {reported.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">รายงานแล้ว ({reported.length})</h2>
              {reported.map(plan => (
                <div key={plan.id} className="rounded-lg border bg-card p-4 flex items-center gap-4 opacity-60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    <Badge className="text-[10px] mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">รายงานแล้ว</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

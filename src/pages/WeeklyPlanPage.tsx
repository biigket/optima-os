import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import AddVisitPlanDialog from '@/components/weekly-plan/AddVisitPlanDialog';
import EditVisitPlanDialog from '@/components/weekly-plan/EditVisitPlanDialog';

interface VisitPlan {
  id: string;
  plan_date: string;
  account_id: string;
  visit_type: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  objective?: string | null;
  products_presented?: string | null;
  notes?: string | null;
  accounts?: { id: string; clinic_name: string; customer_status: string } | null;
}

export default function WeeklyPlanPage() {
  const isMobile = useIsMobile();
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStart, setSelectedStart] = useState('09:00');
  const [selectedEnd, setSelectedEnd] = useState('10:00');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VisitPlan | null>(null);

  const fetchPlans = useCallback(async (date?: Date) => {
    const ref = date || calendarDate;
    const ws = startOfWeek(ref, { weekStartsOn: 1 });
    const we = endOfWeek(ref, { weekStartsOn: 1 });
    const { data } = await supabase
      .from('visit_plans')
      .select('*, accounts(id, clinic_name, customer_status)')
      .gte('plan_date', format(ws, 'yyyy-MM-dd'))
      .lte('plan_date', format(we, 'yyyy-MM-dd'))
      .order('created_at');
    if (data) setPlans(data as unknown as VisitPlan[]);
  }, [calendarDate]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const objectiveColors: Record<string, { bg: string; border: string; text: string }> = {
    'New visit':    { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    'Demo':         { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
    'Follow up':    { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
    'Training':     { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    'เซนต์สัญญา':   { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
    'รับเช็ค':      { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  };
  const defaultColor = { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };

  const statusOverlay: Record<string, number> = {
    PLANNED: 1,
    CHECKED_IN: 0.85,
    REPORTED: 0.6,
  };

  const events = plans.map(p => {
    const st = p.start_time || '09:00';
    const et = p.end_time || '10:00';
    const c = (p.objective && objectiveColors[p.objective]) || defaultColor;
    const opacity = statusOverlay[p.status] ?? 1;
    return {
      id: p.id,
      title: p.accounts?.clinic_name || 'ลูกค้า',
      start: `${p.plan_date}T${st}`,
      end: `${p.plan_date}T${et}`,
      backgroundColor: c.bg,
      borderColor: c.border,
      textColor: c.text,
      extendedProps: { plan: p, opacity },
    };
  });

  function handleDateSelect(info: any) {
    setSelectedDate(info.start);
    setSelectedStart(format(info.start, 'HH:mm'));
    setSelectedEnd(format(info.end, 'HH:mm'));
    setDialogOpen(true);
  }

  async function handleEventDrop(info: any) {
    const plan = info.event.extendedProps.plan as VisitPlan;
    if (plan.status !== 'PLANNED') {
      info.revert();
      toast.error('ย้ายได้เฉพาะแผนที่ยังไม่เช็คอิน');
      return;
    }
    const newDate = format(info.event.start, 'yyyy-MM-dd');
    const newStart = format(info.event.start, 'HH:mm');
    const newEnd = format(info.event.end, 'HH:mm');
    const { error } = await supabase.from('visit_plans').update({
      plan_date: newDate,
      start_time: newStart,
      end_time: newEnd,
    }).eq('id', plan.id);
    if (error) { info.revert(); toast.error('ย้ายไม่สำเร็จ'); return; }
    toast.success('ย้ายแผนเยี่ยมแล้ว');
    fetchPlans();
  }

  async function handleEventResize(info: any) {
    const plan = info.event.extendedProps.plan as VisitPlan;
    if (plan.status !== 'PLANNED') {
      info.revert();
      return;
    }
    const newEnd = format(info.event.end, 'HH:mm');
    await supabase.from('visit_plans').update({ end_time: newEnd }).eq('id', plan.id);
    fetchPlans();
  }

  function handleEventClick(info: any) {
    const plan = info.event.extendedProps.plan as VisitPlan;
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  }

  function handleDatesSet(info: any) {
    setCalendarDate(info.start);
    fetchPlans(info.start);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แผนเยี่ยมรายสัปดาห์</h1>
        <p className="text-sm text-muted-foreground">คลิกหรือลากบนปฏิทินเพื่อเพิ่มแผนเยี่ยม · กดที่แผนเพื่อดู/แก้ไขรายละเอียด</p>
      </div>

      <div className="bg-card rounded-lg border p-2 sm:p-4 weekly-plan-calendar">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale="th"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: 'วันนี้', week: 'สัปดาห์', day: 'วัน' }}
          firstDay={1}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00:00"
          snapDuration="00:15:00"
          allDaySlot={false}
          selectable={!isMobile}
          editable={!isMobile}
          eventDurationEditable={!isMobile}
          selectMirror={!isMobile}
          longPressDelay={500}
          height="auto"
          contentHeight={650}
          events={events}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          eventContent={(arg) => {
            const plan = arg.event.extendedProps.plan as VisitPlan;
            const opacity = arg.event.extendedProps.opacity as number;
            const statusIcon = plan?.status === 'PLANNED' ? '📋' : plan?.status === 'CHECKED_IN' ? '✅' : '📝';
            return (
              <div className="p-1 text-xs leading-tight overflow-hidden h-full" style={{ opacity }}>
                <div className="font-semibold truncate">{arg.event.title}</div>
                {plan?.objective && (
                  <div className="text-[10px] truncate font-medium">{statusIcon} {plan.objective}</div>
                )}
                {plan?.products_presented && (
                  <div className="opacity-70 text-[10px] truncate mt-0.5">🔧 {plan.products_presented}</div>
                )}
                {plan?.notes && (
                  <div className="opacity-60 text-[10px] truncate mt-0.5">📝 {plan.notes}</div>
                )}
              </div>
            );
          }}
        />
      </div>

      <AddVisitPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        startTime={selectedStart}
        endTime={selectedEnd}
        onSuccess={() => fetchPlans()}
      />

      <EditVisitPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        plan={selectedPlan}
        onSuccess={() => fetchPlans()}
      />
    </div>
  );
}

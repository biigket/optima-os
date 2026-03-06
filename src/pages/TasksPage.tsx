import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Circle, CheckCircle2, List, CalendarDays, Users, ClipboardList, AlertCircle, Monitor, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMockAuth } from '@/hooks/useMockAuth';
import CalendarEventDialog from '@/components/tasks/CalendarEventDialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday as isDateToday } from 'date-fns';
import { th } from 'date-fns/locale';

interface ActivityRow {
  id: string;
  title: string;
  activity_type: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  priority: string | null;
  is_done: boolean | null;
  opportunity_id: string;
  account_id: string;
  assigned_to: string[] | null;
  // joined
  opp_stage: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  clinic_name: string | null;
}

const priorityOrder: Record<string, number> = { HIGH: 0, NORMAL: 1, LOW: 2 };

const activityTypeConfig: Record<string, { icon: typeof Phone; color: string }> = {
  CALL: { icon: Phone, color: 'hsl(213 94% 55%)' },
  MEETING: { icon: Users, color: 'hsl(152 60% 42%)' },
  TASK: { icon: ClipboardList, color: 'hsl(38 92% 50%)' },
  DEADLINE: { icon: AlertCircle, color: 'hsl(0 84% 60%)' },
  DEMO: { icon: Monitor, color: 'hsl(270 60% 55%)' },
};

const formatTime12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export default function TasksPage() {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [actRes, oppRes, conRes, accRes] = await Promise.all([
      supabase.from('activities').select('*').order('activity_date', { ascending: true }),
      supabase.from('opportunities').select('id, stage, authority_contact_id, account_id'),
      supabase.from('contacts').select('id, name, phone, account_id'),
      supabase.from('accounts').select('id, clinic_name'),
    ]);

    const activities = actRes.data || [];
    const opps = oppRes.data || [];
    const contacts = conRes.data || [];
    const accounts = accRes.data || [];

    const oppMap = new Map(opps.map(o => [o.id, o]));
    const contactMap = new Map(contacts.map(c => [c.id, c]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Build account → first contact fallback map
    const accountContactMap = new Map<string, { name: string; phone: string | null }>();
    for (const c of contacts) {
      if (!accountContactMap.has(c.account_id)) {
        accountContactMap.set(c.account_id, { name: c.name, phone: c.phone });
      }
    }

    const merged: ActivityRow[] = activities.map(act => {
      const opp = oppMap.get(act.opportunity_id);
      // Priority: authority_contact_id from opportunity → fallback to first contact of account
      const authorityContact = opp?.authority_contact_id ? contactMap.get(opp.authority_contact_id) : null;
      const fallbackContact = accountContactMap.get(act.account_id) || null;
      const contact = authorityContact || fallbackContact;
      const account = accountMap.get(act.account_id);
      return {
        id: act.id,
        title: act.title,
        activity_type: act.activity_type,
        activity_date: act.activity_date,
        start_time: act.start_time,
        end_time: act.end_time,
        priority: act.priority,
        is_done: act.is_done,
        opportunity_id: act.opportunity_id,
        account_id: act.account_id,
        assigned_to: (act.assigned_to as string[] | null) || null,
        opp_stage: opp?.stage || null,
        contact_name: contact?.name || null,
        contact_phone: contact?.phone || null,
        clinic_name: account?.clinic_name || null,
      };
    });

    // Sort: undone first, then by priority, then date
    merged.sort((a, b) => {
      const doneA = a.is_done ? 1 : 0;
      const doneB = b.is_done ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      const pA = priorityOrder[a.priority || 'NORMAL'] ?? 1;
      const pB = priorityOrder[b.priority || 'NORMAL'] ?? 1;
      if (pA !== pB) return pA - pB;
      return a.activity_date.localeCompare(b.activity_date);
    });

    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markDone = async (id: string) => {
    const { error } = await supabase.from('activities').update({ is_done: true }).eq('id', id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    toast.success('ทำเครื่องหมายเสร็จแล้ว');
    setRows(prev => prev.map(r => r.id === id ? { ...r, is_done: true } : r));
  };

  const toggleDone = async (id: string, currentDone: boolean) => {
    const newDone = !currentDone;
    const { error } = await supabase.from('activities').update({ is_done: newDone }).eq('id', id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    toast.success(newDone ? 'ทำเครื่องหมายเสร็จแล้ว' : 'ยกเลิกเสร็จแล้ว');
    setRows(prev => prev.map(r => r.id === id ? { ...r, is_done: newDone } : r));
    setSelectedActivity(prev => prev?.id === id ? { ...prev, is_done: newDone } : prev);
  };

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps as ActivityRow;
    setSelectedActivity(props);
    setDialogOpen(true);
  };

  // Unique assignee names for filter dropdown
  const uniqueAssignees = useMemo(() => {
    const names = new Set<string>();
    rows.forEach(r => r.assigned_to?.forEach(n => names.add(n)));
    return Array.from(names).sort();
  }, [rows]);

  // Filter by assigned user (ADMIN sees all or filtered)
  const isAdmin = currentUser?.role === 'ADMIN';
  const myRows = isAdmin
    ? (assigneeFilter === 'ALL' ? rows : rows.filter(r => r.assigned_to?.includes(assigneeFilter)))
    : rows.filter(r => r.assigned_to?.includes(currentUser?.name || ''));

  // List: show only undone
  const listRows = myRows.filter(r => !r.is_done && r.title.toLowerCase().includes(search.toLowerCase()));

  // Calendar events: all assigned to user
  const calendarEvents = myRows.map(r => {
    const dateStr = r.activity_date;
    let start = dateStr;
    let end: string | undefined;
    if (r.start_time) {
      start = `${dateStr}T${r.start_time}`;
      if (r.end_time) end = `${dateStr}T${r.end_time}`;
    }
    const config = activityTypeConfig[r.activity_type] || activityTypeConfig.TASK;
    return {
      id: r.id,
      title: r.title,
      start,
      end,
      extendedProps: r,
      classNames: [],
      borderColor: config.color,
      backgroundColor: `${config.color.replace(')', ' / 0.1)')}`,
    };
  });

  const handleEventDrop = async (info: any) => {
    const id = info.event.id;
    const newDate = info.event.startStr.slice(0, 10);
    const newStart = info.event.start ? info.event.start.toTimeString().slice(0, 5) : null;
    const newEnd = info.event.end ? info.event.end.toTimeString().slice(0, 5) : null;
    const update: Record<string, any> = { activity_date: newDate };
    if (newStart) update.start_time = newStart;
    if (newEnd) update.end_time = newEnd;
    const { error } = await supabase.from('activities').update(update).eq('id', id);
    if (error) { toast.error('ย้ายไม่สำเร็จ'); info.revert(); return; }
    toast.success('ย้ายกิจกรรมแล้ว');
    setRows(prev => prev.map(r => r.id === id ? { ...r, activity_date: newDate, start_time: newStart, end_time: newEnd } : r));
  };

  const handleEventResize = async (info: any) => {
    const id = info.event.id;
    const newDate = info.event.startStr.slice(0, 10);
    const newStart = info.event.start ? info.event.start.toTimeString().slice(0, 5) : null;
    const newEnd = info.event.end ? info.event.end.toTimeString().slice(0, 5) : null;
    const update: Record<string, any> = { activity_date: newDate };
    if (newStart) update.start_time = newStart;
    if (newEnd) update.end_time = newEnd;
    const { error } = await supabase.from('activities').update(update).eq('id', id);
    if (error) { toast.error('เปลี่ยนเวลาไม่สำเร็จ'); info.revert(); return; }
    toast.success('เปลี่ยนเวลาแล้ว');
    setRows(prev => prev.map(r => r.id === id ? { ...r, activity_date: newDate, start_time: newStart, end_time: newEnd } : r));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">งาน</h1>
          <p className="text-sm text-muted-foreground">{listRows.length} รายการที่ยังไม่เสร็จ</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="ค้นหางาน..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {isAdmin && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                {uniqueAssignees.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5"><List size={14} />รายการ</TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays size={14} />ปฏิทิน</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
          ) : listRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">ไม่มีงานที่ต้องทำ</div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-3 w-10"></th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">กิจกรรม</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">วัน/เวลา</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">ผู้ติดต่อ</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">ความสำคัญ</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">มอบหมาย</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Stage</th>
                    <th className="px-3 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {listRows.map(row => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => markDone(row.id)} className="text-muted-foreground hover:text-success transition-colors">
                          <Circle size={18} />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{row.title}</div>
                        <div className="text-xs text-muted-foreground">{row.clinic_name}</div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(row.activity_date).toLocaleDateString('th-TH')}
                        {row.start_time && <span className="ml-1">{row.start_time}{row.end_time ? `–${row.end_time}` : ''}</span>}
                      </td>
                      <td className="px-3 py-3">
                        {row.contact_name ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground">{row.contact_name}</span>
                            {row.contact_phone && (
                              <a href={`tel:${row.contact_phone}`} onClick={e => e.stopPropagation()} className="text-primary hover:text-primary/80">
                                <Phone size={13} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {row.priority && <StatusBadge status={row.priority} />}
                      </td>
                      <td className="px-3 py-3">
                        {row.assigned_to && row.assigned_to.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.assigned_to.map(name => (
                              <span key={name} className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">{name}</span>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {row.opp_stage ? (
                          <button onClick={() => navigate(`/opportunities/${row.opportunity_id}`)} className="hover:underline">
                            <StatusBadge status={row.opp_stage} />
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(row.activity_date).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="rounded-lg border bg-card p-4 tasks-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              locale="th"
              events={calendarEvents}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventClick={handleEventClick}
              height="auto"
              slotDuration="00:15:00"
              snapDuration="00:15:00"
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              eventContent={(arg) => {
                const props = arg.event.extendedProps as ActivityRow;
                const config = activityTypeConfig[props.activity_type] || activityTypeConfig.TASK;
                const TypeIcon = config.icon;
                return (
                  <div className="px-1.5 py-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon size={12} style={{ color: config.color }} className="shrink-0" />
                      <span className="font-semibold truncate flex-1">{arg.event.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {props.priority === 'HIGH' && <ArrowUp size={12} className="text-destructive" />}
                        {!props.is_done ? (
                          <button onClick={(e) => { e.stopPropagation(); markDone(props.id); }} className="text-muted-foreground hover:text-success">
                            <Circle size={13} />
                          </button>
                        ) : (
                          <CheckCircle2 size={13} className="text-success" />
                        )}
                      </div>
                    </div>
                    {props.clinic_name && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 ml-5 truncate">{props.clinic_name}</div>
                    )}
                    {props.contact_name && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 ml-5 flex items-center gap-1">
                        <span className="truncate">{props.contact_name}</span>
                        {props.contact_phone && (
                          <a href={`tel:${props.contact_phone}`} onClick={e => e.stopPropagation()} className="text-primary hover:text-primary/80 shrink-0">
                            <Phone size={10} />
                          </a>
                        )}
                      </div>
                    )}
                    {props.start_time && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                        {formatTime12(props.start_time)}{props.end_time ? ` → ${formatTime12(props.end_time)}` : ''}
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <CalendarEventDialog
        activity={selectedActivity}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onToggleDone={toggleDone}
      />
    </div>
  );
}

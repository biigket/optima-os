import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth, useCanSeeAll, MOCK_SALES } from '@/hooks/useMockAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday as isDateToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Monitor, Building2, Trash2 } from 'lucide-react';
import type { EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core';

interface DemoRow {
  id: string;
  demo_date: string | null;
  confirmed: boolean;
  account_id: string | null;
  products_demo: string[] | null;
  visited_by: string[] | null;
  clinic_name?: string;
}

interface CompanyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  event_type: string;
  created_by: string | null;
}

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  MEETING: { label: '🤝 ประชุมบริษัท', color: 'hsl(213 94% 55%)' },
  HOLIDAY: { label: '🏖️ วันหยุด', color: 'hsl(0 84% 60%)' },
  TRAINING: { label: '📚 อบรม', color: 'hsl(38 92% 50%)' },
  EVENT: { label: '🎉 อีเวนท์', color: 'hsl(152 60% 42%)' },
  OTHER: { label: '📌 อื่นๆ', color: 'hsl(270 60% 55%)' },
};

const timeSlots: string[] = [];
for (let h = 7; h <= 21; h++) {
  for (let m = 0; m < 60; m += 15) {
    timeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export default function CalendarPage() {
  const { currentUser } = useMockAuth();
  const canSeeAll = useCanSeeAll();
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [miniMonth, setMiniMonth] = useState(new Date());
  const [showMobileMiniCal, setShowMobileMiniCal] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Create event dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newAllDay, setNewAllDay] = useState(true);
  const [newEventType, setNewEventType] = useState('MEETING');
  const [saving, setSaving] = useState(false);

  // View event dialog
  const [viewOpen, setViewOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<CompanyEvent | DemoRow | null>(null);
  const [viewType, setViewType] = useState<'company' | 'demo'>('company');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [demosRes, eventsRes] = await Promise.all([
      supabase.from('demos').select('id, demo_date, confirmed, account_id, products_demo, visited_by').order('demo_date'),
      supabase.from('company_events').select('*').order('event_date'),
    ]);

    let demoRows: DemoRow[] = (demosRes.data || []) as DemoRow[];

    // Fetch clinic names for demos
    const accountIds = [...new Set(demoRows.map(d => d.account_id).filter(Boolean))] as string[];
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase.from('accounts').select('id, clinic_name').in('id', accountIds);
      const nameMap = new Map((accounts || []).map(a => [a.id, a.clinic_name]));
      demoRows = demoRows.map(d => ({ ...d, clinic_name: d.account_id ? nameMap.get(d.account_id) || '' : '' }));
    }

    setDemos(demoRows);
    setCompanyEvents((eventsRes.data || []) as CompanyEvent[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter demos by assignee
  const filteredDemos = useMemo(() => {
    if (assigneeFilter === 'ALL') return demos;
    return demos.filter(d => d.visited_by?.includes(assigneeFilter));
  }, [demos, assigneeFilter]);

  // Unique assignees from demos
  const uniqueAssignees = useMemo(() => {
    const names = new Set<string>();
    demos.forEach(d => d.visited_by?.forEach(n => names.add(n)));
    return Array.from(names).sort();
  }, [demos]);

  // Build calendar events
  const calendarEvents: EventInput[] = useMemo(() => {
    const events: EventInput[] = [];

    // Demos
    filteredDemos.forEach(d => {
      if (!d.demo_date) return;
      events.push({
        id: `demo-${d.id}`,
        title: `🎯 ${d.clinic_name || 'เดโม'}`,
        start: d.demo_date,
        allDay: true,
        backgroundColor: d.confirmed ? 'hsl(152 60% 42%)' : 'hsl(38 92% 50%)',
        borderColor: d.confirmed ? 'hsl(152 60% 42%)' : 'hsl(38 92% 50%)',
        textColor: '#fff',
        extendedProps: { type: 'demo', data: d },
      });
    });

    // Company events
    companyEvents.forEach(e => {
      const config = EVENT_TYPES[e.event_type] || EVENT_TYPES.OTHER;
      if (e.all_day) {
        events.push({
          id: `ce-${e.id}`,
          title: e.title,
          start: e.event_date,
          allDay: true,
          backgroundColor: config.color,
          borderColor: config.color,
          textColor: '#fff',
          extendedProps: { type: 'company', data: e },
        });
      } else {
        events.push({
          id: `ce-${e.id}`,
          title: e.title,
          start: `${e.event_date}T${e.start_time || '09:00'}`,
          end: `${e.event_date}T${e.end_time || '10:00'}`,
          allDay: false,
          backgroundColor: config.color,
          borderColor: config.color,
          textColor: '#fff',
          extendedProps: { type: 'company', data: e },
        });
      }
    });

    return events;
  }, [filteredDemos, companyEvents]);

  const handleEventClick = (info: EventClickArg) => {
    const { type, data } = info.event.extendedProps;
    setViewType(type);
    setViewEvent(data);
    setViewOpen(true);
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setNewDate(info.startStr.split('T')[0]);
    setCreateOpen(true);
  };

  const handleEventDrop = async (info: any) => {
    const { type, data } = info.event.extendedProps;
    if (type === 'demo') {
      const newDate = format(info.event.start, 'yyyy-MM-dd');
      const { error } = await supabase.from('demos').update({ demo_date: newDate } as any).eq('id', data.id);
      if (error) { toast.error('ย้ายเดโมไม่สำเร็จ'); info.revert(); }
      else { toast.success('ย้ายเดโมแล้ว'); fetchData(); }
    } else if (type === 'company') {
      const newDate = format(info.event.start, 'yyyy-MM-dd');
      const { error } = await supabase.from('company_events').update({ event_date: newDate } as any).eq('id', data.id);
      if (error) { toast.error('ย้ายกิจกรรมไม่สำเร็จ'); info.revert(); }
      else { toast.success('ย้ายกิจกรรมแล้ว'); fetchData(); }
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDate) return;
    setSaving(true);
    const { error } = await supabase.from('company_events').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      event_date: newDate,
      start_time: newAllDay ? null : newStartTime,
      end_time: newAllDay ? null : newEndTime,
      all_day: newAllDay,
      event_type: newEventType,
      created_by: currentUser?.name || null,
    } as any);
    if (error) { toast.error('สร้างกิจกรรมไม่สำเร็จ'); }
    else {
      toast.success('สร้างกิจกรรมบริษัทแล้ว');
      setNewTitle(''); setNewDesc(''); setNewAllDay(true); setNewEventType('MEETING');
      setCreateOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (viewType === 'company' && viewEvent) {
      const { error } = await supabase.from('company_events').delete().eq('id', (viewEvent as CompanyEvent).id);
      if (error) toast.error('ลบไม่สำเร็จ');
      else { toast.success('ลบกิจกรรมแล้ว'); fetchData(); }
      setViewOpen(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ปฏิทิน</h1>
          <p className="text-sm text-muted-foreground">กิจกรรมบริษัท & เดโม — ภาพรวมทั้งทีม</p>
        </div>
        <Button size="sm" className="gap-1" onClick={() => { setNewDate(format(new Date(), 'yyyy-MM-dd')); setCreateOpen(true); }}>
          <Plus size={14} /> สร้างกิจกรรม
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'hsl(152 60% 42%)' }} /> เดโมยืนยัน</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: 'hsl(38 92% 50%)' }} /> เดโมรอยืนยัน</span>
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: v.color }} /> {v.label.replace(/^.{2} /, '')}</span>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="hidden lg:block w-[220px] shrink-0 space-y-4">
          {/* Mini calendar */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setMiniMonth(prev => subMonths(prev, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronLeft size={16} /></button>
              <span className="text-sm font-semibold text-foreground">{format(miniMonth, 'MMMM yyyy', { locale: th })}</span>
              <button onClick={() => setMiniMonth(prev => addMonths(prev, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 text-center mb-1">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center">
              {(() => {
                const ms = startOfMonth(miniMonth);
                const me = endOfMonth(miniMonth);
                const cs = startOfWeek(ms, { weekStartsOn: 0 });
                const ce = endOfWeek(me, { weekStartsOn: 0 });
                const days: Date[] = [];
                let day = cs;
                while (day <= ce) { days.push(day); day = addDays(day, 1); }
                return days.map((d, i) => {
                  const inMonth = isSameMonth(d, miniMonth);
                  const selected = isSameDay(d, selectedDate);
                  const today = isDateToday(d);
                  return (
                    <button key={i} onClick={() => { setSelectedDate(d); calendarRef.current?.getApi().gotoDate(d); }}
                      className={`text-[11px] py-1 rounded-full w-7 h-7 mx-auto flex items-center justify-center transition-colors
                        ${!inMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                        ${selected ? 'bg-accent text-accent-foreground font-bold' : ''}
                        ${today && !selected ? 'bg-accent/20 font-semibold' : ''}
                        ${!selected ? 'hover:bg-muted' : ''}
                      `}
                    >{format(d, 'd')}</button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Employee filter */}
          {isAdmin && uniqueAssignees.length > 0 && (
            <div className="rounded-lg border bg-card p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">กรองตามพนักงาน</div>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  {uniqueAssignees.map(name => (<SelectItem key={name} value={name}>{name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Main calendar */}
        <div className="flex-1 min-w-0 rounded-lg border bg-card overflow-hidden">
          {/* Custom header */}
          <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b bg-card gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <Button variant="outline" size="sm" className="text-xs px-2 sm:px-3 shrink-0" onClick={() => {
                const today = new Date();
                setSelectedDate(today); setMiniMonth(today);
                calendarRef.current?.getApi().today();
              }}>วันนี้</Button>
              <button onClick={() => { calendarRef.current?.getApi().prev(); setSelectedDate(calendarRef.current?.getApi().getDate() || new Date()); }} className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0"><ChevronLeft size={16} /></button>
              <button onClick={() => { calendarRef.current?.getApi().next(); setSelectedDate(calendarRef.current?.getApi().getDate() || new Date()); }} className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0"><ChevronRight size={16} /></button>
              <button onClick={() => setShowMobileMiniCal(prev => !prev)}
                className="lg:pointer-events-none text-xs sm:text-sm font-semibold text-foreground truncate hover:bg-muted lg:hover:bg-transparent px-1.5 py-0.5 rounded">
                {calendarRef.current?.getApi()?.view?.title || format(selectedDate, 'MMMM yyyy', { locale: th })}
              </button>
            </div>
            <div className="flex items-center rounded-lg border overflow-hidden shrink-0">
              {['dayGridMonth', 'timeGridWeek', 'timeGridDay'].map((v, i) => {
                const labels = ['เดือน', 'สัปดาห์', 'วัน'];
                const hideOnMobile = v === 'timeGridWeek';
                return (
                  <button key={v}
                    onClick={() => { setCalendarView(v); calendarRef.current?.getApi().changeView(v); }}
                    className={`${hideOnMobile ? 'hidden lg:block' : ''} px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${calendarView === v ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >{labels[i]}</button>
                );
              })}
            </div>
          </div>

          {/* Mobile mini calendar */}
          {showMobileMiniCal && (
            <div className="lg:hidden border-b bg-card p-3">
              <div className="max-w-[260px] mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setMiniMonth(prev => subMonths(prev, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-semibold text-foreground">{format(miniMonth, 'MMMM yyyy', { locale: th })}</span>
                  <button onClick={() => setMiniMonth(prev => addMonths(prev, 1))} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 text-center mb-1">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                    <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-center">
                  {(() => {
                    const ms = startOfMonth(miniMonth);
                    const me = endOfMonth(miniMonth);
                    const cs = startOfWeek(ms, { weekStartsOn: 0 });
                    const ce = endOfWeek(me, { weekStartsOn: 0 });
                    const days: Date[] = [];
                    let day = cs;
                    while (day <= ce) { days.push(day); day = addDays(day, 1); }
                    return days.map((d, i) => {
                      const inMonth = isSameMonth(d, miniMonth);
                      const selected = isSameDay(d, selectedDate);
                      const today = isDateToday(d);
                      return (
                        <button key={i} onClick={() => { setSelectedDate(d); calendarRef.current?.getApi().gotoDate(d); setShowMobileMiniCal(false); }}
                          className={`text-[11px] py-1 rounded-full w-8 h-8 mx-auto flex items-center justify-center transition-colors
                            ${!inMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                            ${selected ? 'bg-accent text-accent-foreground font-bold' : ''}
                            ${today && !selected ? 'bg-accent/20 font-semibold' : ''}
                            ${!selected ? 'hover:bg-muted' : ''}
                          `}
                        >{format(d, 'd')}</button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="p-0 sm:p-1">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={false}
              locale="th"
              events={calendarEvents}
              editable={true}
              selectable={true}
              select={handleDateSelect}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              height="auto"
              slotDuration="00:30:00"
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              datesSet={(info) => { setSelectedDate(info.start); setMiniMonth(info.start); }}
              dayMaxEvents={3}
              eventContent={(arg) => {
                const isMonth = arg.view.type === 'dayGridMonth';
                return (
                  <div className={`px-1.5 py-0.5 text-[11px] font-medium truncate ${isMonth ? '' : 'py-1'}`}>
                    {arg.event.title}
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>

      {/* Create Company Event Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 size={18} /> สร้างกิจกรรมบริษัท</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="ชื่อกิจกรรม" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Textarea placeholder="รายละเอียด (ถ้ามี)" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="min-h-[80px]" />
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">วันที่</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">ประเภท</Label>
                <Select value={newEventType} onValueChange={setNewEventType}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={newAllDay} onCheckedChange={setNewAllDay} id="all-day" />
              <Label htmlFor="all-day" className="text-sm">ทั้งวัน</Label>
            </div>
            {!newAllDay && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">เริ่ม</Label>
                  <Select value={newStartTime} onValueChange={(v) => { setNewStartTime(v); const idx = timeSlots.indexOf(v); if (idx >= 0 && idx + 4 < timeSlots.length) setNewEndTime(timeSlots[idx + 4]); }}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">สิ้นสุด</Label>
                  <Select value={newEndTime} onValueChange={setNewEndTime}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{timeSlots.filter(t => t > newStartTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <Button onClick={handleCreate} disabled={saving || !newTitle.trim() || !newDate} className="w-full">
              {saving ? 'กำลังบันทึก...' : 'สร้างกิจกรรม'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewType === 'demo' ? <><Monitor size={18} /> รายละเอียดเดโม</> : <><Building2 size={18} /> กิจกรรมบริษัท</>}
            </DialogTitle>
          </DialogHeader>
          {viewType === 'demo' && viewEvent && (() => {
            const d = viewEvent as DemoRow;
            return (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">คลินิก:</span> {d.clinic_name || '—'}</p>
                <p><span className="text-muted-foreground">วันที่:</span> {d.demo_date ? new Date(d.demo_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
                <p><span className="text-muted-foreground">สินค้า:</span> {d.products_demo?.join(', ') || '—'}</p>
                <p><span className="text-muted-foreground">สถานะ:</span> {d.confirmed ? '✅ ยืนยันแล้ว' : '⏳ รอยืนยัน'}</p>
                {d.visited_by && d.visited_by.length > 0 && (
                  <p><span className="text-muted-foreground">ผู้รับผิดชอบ:</span> {d.visited_by.join(', ')}</p>
                )}
              </div>
            );
          })()}
          {viewType === 'company' && viewEvent && (() => {
            const e = viewEvent as CompanyEvent;
            const config = EVENT_TYPES[e.event_type] || EVENT_TYPES.OTHER;
            return (
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-base">{e.title}</p>
                <p><span className="text-muted-foreground">ประเภท:</span> {config.label}</p>
                <p><span className="text-muted-foreground">วันที่:</span> {new Date(e.event_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {!e.all_day && <p><span className="text-muted-foreground">เวลา:</span> {e.start_time} — {e.end_time}</p>}
                {e.all_day && <p><span className="text-muted-foreground">เวลา:</span> ทั้งวัน</p>}
                {e.description && <p><span className="text-muted-foreground">รายละเอียด:</span> {e.description}</p>}
                {e.created_by && <p className="text-xs text-muted-foreground">สร้างโดย: {e.created_by}</p>}
                <div className="pt-2">
                  <Button variant="destructive" size="sm" className="gap-1" onClick={handleDelete}>
                    <Trash2 size={14} /> ลบกิจกรรม
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

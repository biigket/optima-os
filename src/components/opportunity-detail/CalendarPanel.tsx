import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Phone, Users, Building2, Target, AlertTriangle, Plus } from 'lucide-react';
import { format, addDays, subDays, isToday, isBefore } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Activity } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  CALL: { icon: Phone, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  MEETING: { icon: Users, bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  TASK: { icon: Building2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  DEADLINE: { icon: Target, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
};

const PX_PER_HOUR = 48;

interface CalendarPanelProps {
  activities: Activity[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activeActivityId?: string | null;
  onActivityClick?: (activity: Activity) => void;
  previewOverrides?: Partial<Activity> | null;
  onActivityReschedule?: (activityId: string, newStartTime: string, newEndTime: string | null) => void;
  onQuickScheduleClick?: (startTime: string, endTime: string) => void;
}

function isOverdue(act: Activity, now: Date): boolean {
  if (act.is_done) return false;
  if (!act.start_time) {
    return isBefore(new Date(act.activity_date + 'T23:59:59'), now);
  }
  return isBefore(new Date(`${act.activity_date}T${act.start_time}`), now);
}

function pxToTime(px: number): string {
  const totalMinutes = Math.round(px / PX_PER_HOUR * 60 / 15) * 15;
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 45));
  const h = Math.floor(clamped / 60).toString().padStart(2, '0');
  const m = (clamped % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function CalendarPanel({
  activities, selectedDate, onDateChange,
  activeActivityId, onActivityClick, previewOverrides,
  onActivityReschedule, onQuickScheduleClick,
}: CalendarPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [dragCurrentTop, setDragCurrentTop] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isToday(selectedDate) && gridRef.current) {
      const h = currentTime.getHours();
      const scrollTo = Math.max((h - 1) * PX_PER_HOUR, 0);
      gridRef.current.scrollTop = scrollTo;
    }
  }, [selectedDate]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const mergedActivities = activities.map(a => {
    if (previewOverrides && activeActivityId && a.id === activeActivityId) {
      return { ...a, ...previewOverrides };
    }
    return a;
  });

  const dayActivities = mergedActivities.filter(a => a.activity_date === dateStr);
  const timedActivities = dayActivities.filter(a => a.start_time);
  const isTodaySelected = isToday(selectedDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getBlockStyle = (act: Activity) => {
    if (!act.start_time) return {};
    const startMin = timeToMinutes(act.start_time);
    let endMin = startMin + 60;
    if (act.end_time) {
      endMin = timeToMinutes(act.end_time);
    }
    const top = (startMin / 60) * PX_PER_HOUR;
    const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 20);
    return { top: `${top}px`, height: `${height}px` };
  };

  const currentTimePosition = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    return (h * 60 + m) / 60 * PX_PER_HOUR;
  };

  // --- Drag handlers ---
  const handleDragStart = useCallback((e: React.MouseEvent, act: Activity) => {
    if (!act.start_time || !onActivityReschedule) return;
    e.preventDefault();
    e.stopPropagation();

    const gridRect = gridRef.current?.getBoundingClientRect();
    const scrollTop = gridRef.current?.scrollTop || 0;
    if (!gridRect) return;

    const startMin = timeToMinutes(act.start_time);
    const blockTop = (startMin / 60) * PX_PER_HOUR;
    const mouseY = e.clientY - gridRect.top + scrollTop;
    
    setDraggingId(act.id);
    setDragOffsetY(mouseY - blockTop);
    setDragCurrentTop(blockTop);
  }, [onActivityReschedule]);

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const gridRect = gridRef.current?.getBoundingClientRect();
      const scrollTop = gridRef.current?.scrollTop || 0;
      if (!gridRect) return;
      const mouseY = e.clientY - gridRect.top + scrollTop;
      const newTop = mouseY - dragOffsetY;
      setDragCurrentTop(Math.max(0, newTop));
    };

    const handleMouseUp = () => {
      if (!draggingId) return;
      const act = activities.find(a => a.id === draggingId);
      if (act && act.start_time) {
        const newStartTime = pxToTime(dragCurrentTop);
        const oldStartMin = timeToMinutes(act.start_time);
        const oldEndMin = act.end_time ? timeToMinutes(act.end_time) : oldStartMin + 60;
        const duration = oldEndMin - oldStartMin;
        const newStartMin = timeToMinutes(newStartTime);
        const newEndMin = Math.min(newStartMin + duration, 24 * 60);
        const newEndTime = act.end_time ? pxToTime((newEndMin / 60) * PX_PER_HOUR) : null;
        onActivityReschedule?.(draggingId, newStartTime, newEndTime);
      }
      setDraggingId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, dragOffsetY, dragCurrentTop, activities, onActivityReschedule]);

  // --- Quick schedule default slot ---
  const getDefaultSlotTime = () => {
    const h = new Date().getHours();
    const nextHour = Math.min(h + 1, 23);
    const start = `${nextHour.toString().padStart(2, '0')}:00`;
    const end = `${Math.min(nextHour + 1, 24).toString().padStart(2, '0')}:00`;
    return { start, end: end === '24:00' ? '23:59' : end };
  };

  const defaultSlot = getDefaultSlotTime();

  // Check if there are no timed activities for today
  const showQuickSlot = isTodaySelected && onQuickScheduleClick;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDateChange(subDays(selectedDate, 1))}>
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm font-semibold text-foreground">
            {format(selectedDate, 'EEEE, MMMM do', { locale: th })}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDateChange(addDays(selectedDate, 1))}>
            <ChevronRight size={14} />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onDateChange(new Date())}>
          Today
        </Button>
      </div>

      {/* Daily activity list */}
      {dayActivities.length > 0 && (
        <div className="px-4 py-2 border-b bg-muted/30 space-y-1">
          {dayActivities.map(act => {
            const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
            const Icon = cfg.icon;
            const isActive = activeActivityId === act.id;
            const isDone = act.is_done;
            const overdue = isOverdue(act, now);
            return (
              <button
                key={act.id}
                onClick={() => onActivityClick?.(act)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all
                  ${cfg.bg} ${cfg.text}
                  ${isDone ? 'opacity-50' : ''}
                  ${isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:opacity-80'}
                `}
              >
                <Icon size={11} />
                <span className={`font-medium truncate ${isDone ? 'line-through' : ''}`}>{act.title}</span>
                {overdue && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                    <AlertTriangle size={8} /> OVERDUE
                  </span>
                )}
                {act.start_time && <span className="ml-auto text-[10px] opacity-70">{act.start_time}</span>}
                {isDone && <span className="text-[9px] ml-1">✅</span>}
              </button>
            );
          })}
        </div>
      )}

      {dayActivities.length === 0 && (
        <div className="px-4 py-3 border-b bg-muted/20 text-center">
          <span className="text-xs text-muted-foreground">ไม่มีกิจกรรมในวันนี้</span>
        </div>
      )}

      {/* Time Grid */}
      <div
        className={`relative overflow-y-auto max-h-[400px] ${draggingId ? 'select-none' : ''}`}
        ref={gridRef}
      >
        <div className="relative" style={{ height: `${24 * PX_PER_HOUR}px` }}>
          {/* Hour lines */}
          {hours.map(h => (
            <div key={h} className="absolute w-full flex items-start" style={{ top: `${h * PX_PER_HOUR}px` }}>
              <span className="text-[9px] text-muted-foreground w-10 text-right pr-2 -mt-1.5 shrink-0">
                {h.toString().padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>
          ))}

          {/* Current time line */}
          {isTodaySelected && (
            <div className="absolute left-10 right-0 z-10 flex items-center" style={{ top: `${currentTimePosition()}px` }}>
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 border-t border-red-500" />
              <span className="text-[9px] text-red-500 font-medium ml-1">
                {format(currentTime, 'HH:mm')}
              </span>
            </div>
          )}

          {/* Quick schedule default slot */}
          {showQuickSlot && (
            <button
              onClick={() => onQuickScheduleClick?.(defaultSlot.start, defaultSlot.end)}
              className="absolute left-12 right-2 rounded-md border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all px-2 py-1 text-left group z-5"
              style={{
                top: `${(timeToMinutes(defaultSlot.start) / 60) * PX_PER_HOUR}px`,
                height: `${PX_PER_HOUR}px`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Plus size={12} className="text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-[10px] text-primary/50 group-hover:text-primary font-medium transition-colors">
                  คลิกเพื่อสร้างกิจกรรม {defaultSlot.start} - {defaultSlot.end}
                </span>
              </div>
            </button>
          )}

          {/* Activity blocks */}
          <div className="absolute left-12 right-2 top-0 bottom-0">
            {timedActivities.map(act => {
              const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
              const Icon = cfg.icon;
              const isDragging = draggingId === act.id;
              const style = isDragging
                ? { top: `${dragCurrentTop}px`, height: getBlockStyle(act).height }
                : getBlockStyle(act);
              const isActive = activeActivityId === act.id;
              const isDone = act.is_done;
              const overdue = isOverdue(act, now);
              
              // Show snapped time preview while dragging
              const dragTimePreview = isDragging ? pxToTime(dragCurrentTop) : null;

              return (
                <div
                  key={act.id}
                  className={`absolute left-0 right-0 rounded-md border px-2 py-1 text-left transition-shadow
                    ${cfg.bg} ${cfg.border} ${cfg.text}
                    ${isDone ? 'opacity-50' : ''}
                    ${isActive ? 'ring-2 ring-primary ring-offset-1 z-20' : 'hover:opacity-80'}
                    ${overdue ? 'border-destructive/50' : ''}
                    ${isDragging ? 'z-30 shadow-lg opacity-90 cursor-grabbing' : onActivityReschedule && act.start_time ? 'cursor-grab' : 'cursor-pointer'}
                  `}
                  style={style}
                  onMouseDown={(e) => handleDragStart(e, act)}
                  onClick={() => !isDragging && onActivityClick?.(act)}
                >
                  <div className="flex items-center gap-1">
                    <Icon size={10} />
                    <span className={`text-[10px] font-medium truncate ${isDone ? 'line-through' : ''}`}>{act.title}</span>
                    {overdue && <AlertTriangle size={9} className="text-destructive shrink-0" />}
                  </div>
                  <span className="text-[9px] opacity-70">
                    {isDragging && dragTimePreview
                      ? `${dragTimePreview} (กำลังย้าย...)`
                      : `${act.start_time}${act.end_time ? ` - ${act.end_time}` : ''}`
                    }
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Phone, Users, Building2, Target, AlertTriangle } from 'lucide-react';
import { format, addDays, subDays, isToday, isBefore } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Activity } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; border: string; text: string }> = {
  CALL: { icon: Phone, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  MEETING: { icon: Users, bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  TASK: { icon: Building2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  DEADLINE: { icon: Target, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
};

interface CalendarPanelProps {
  activities: Activity[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activeActivityId?: string | null;
  onActivityClick?: (activity: Activity) => void;
  previewOverrides?: Partial<Activity> | null;
}

function isOverdue(act: Activity, now: Date): boolean {
  if (act.is_done) return false;
  if (!act.start_time) {
    return isBefore(new Date(act.activity_date + 'T23:59:59'), now);
  }
  return isBefore(new Date(`${act.activity_date}T${act.start_time}`), now);
}

export default function CalendarPanel({
  activities, selectedDate, onDateChange,
  activeActivityId, onActivityClick, previewOverrides,
}: CalendarPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to current time on today
  useEffect(() => {
    if (isToday(selectedDate) && gridRef.current) {
      const h = currentTime.getHours();
      const scrollTo = Math.max((h - 1) * 48, 0);
      gridRef.current.scrollTop = scrollTo;
    }
  }, [selectedDate]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Merge preview overrides for active editing activity
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
    const [sh, sm] = act.start_time.split(':').map(Number);
    const startMin = sh * 60 + (sm || 0);
    let endMin = startMin + 60;
    if (act.end_time) {
      const [eh, em] = act.end_time.split(':').map(Number);
      endMin = eh * 60 + (em || 0);
    }
    const top = (startMin / 60) * 48;
    const height = Math.max(((endMin - startMin) / 60) * 48, 20);
    return { top: `${top}px`, height: `${height}px` };
  };

  const currentTimePosition = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    return (h * 60 + m) / 60 * 48;
  };

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
      <div className="relative overflow-y-auto max-h-[400px]" ref={gridRef}>
        <div className="relative" style={{ height: `${24 * 48}px` }}>
          {/* Hour lines */}
          {hours.map(h => (
            <div key={h} className="absolute w-full flex items-start" style={{ top: `${h * 48}px` }}>
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

          {/* Activity blocks */}
          <div className="absolute left-12 right-2 top-0 bottom-0">
            {timedActivities.map(act => {
              const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
              const Icon = cfg.icon;
              const style = getBlockStyle(act);
              const isActive = activeActivityId === act.id;
              const isDone = act.is_done;
              const overdue = isOverdue(act, now);
              return (
                <button
                  key={act.id}
                  onClick={() => onActivityClick?.(act)}
                  className={`absolute left-0 right-0 rounded-md border px-2 py-1 text-left transition-all
                    ${cfg.bg} ${cfg.border} ${cfg.text}
                    ${isDone ? 'opacity-50' : ''}
                    ${isActive ? 'ring-2 ring-primary ring-offset-1 z-20' : 'hover:opacity-80'}
                    ${overdue ? 'border-destructive/50' : ''}
                  `}
                  style={style}
                >
                  <div className="flex items-center gap-1">
                    <Icon size={10} />
                    <span className={`text-[10px] font-medium truncate ${isDone ? 'line-through' : ''}`}>{act.title}</span>
                    {overdue && <AlertTriangle size={9} className="text-destructive shrink-0" />}
                  </div>
                  <span className="text-[9px] opacity-70">
                    {act.start_time}{act.end_time ? ` - ${act.end_time}` : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

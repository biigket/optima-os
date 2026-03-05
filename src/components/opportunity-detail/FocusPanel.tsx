import { Phone, Users, Building2, Target, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Activity } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  CALL: { icon: Phone, label: 'Call', color: 'text-blue-600 bg-blue-50' },
  MEETING: { icon: Users, label: 'Meeting', color: 'text-violet-600 bg-violet-50' },
  TASK: { icon: Building2, label: 'Task', color: 'text-emerald-600 bg-emerald-50' },
  DEADLINE: { icon: Target, label: 'Deadline', color: 'text-red-600 bg-red-50' },
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  NORMAL: 'bg-muted text-muted-foreground',
  LOW: 'bg-muted text-muted-foreground',
};

interface FocusPanelProps {
  activities: Activity[];
  onMarkDone: (id: string) => void;
}

export default function FocusPanel({ activities, onMarkDone }: FocusPanelProps) {
  const pending = activities.filter(a => !a.is_done).sort((a, b) => a.activity_date.localeCompare(b.activity_date));

  if (pending.length === 0) return null;

  const handleDone = async (id: string) => {
    const { error } = await supabase.from('activities').update({ is_done: true }).eq('id', id);
    if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
    onMarkDone(id);
    toast.success('เสร็จสิ้นกิจกรรม');
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Clock size={12} /> กิจกรรมที่ต้องทำ ({pending.length})
      </p>
      {pending.map(act => {
        const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
        const Icon = cfg.icon;
        const isOverdue = new Date(act.activity_date) < new Date(new Date().toDateString());
        return (
          <div key={act.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${isOverdue ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' : 'border-border bg-muted/20'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{act.title}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span>{act.activity_date}</span>
                {act.start_time && <span>{act.start_time}{act.end_time ? ` - ${act.end_time}` : ''}</span>}
                {isOverdue && <span className="text-red-500 font-semibold flex items-center gap-0.5"><AlertTriangle size={9} /> OVERDUE</span>}
                {act.priority === 'HIGH' && <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${PRIORITY_STYLES.HIGH}`}>HIGH</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0" onClick={() => handleDone(act.id)}>
              <CheckCircle2 size={12} /> Done
            </Button>
          </div>
        );
      })}
    </div>
  );
}

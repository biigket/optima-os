import { useState } from 'react';
import { Phone, Users, Building2, Target, AlertTriangle, MoreHorizontal, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Activity } from '@/types';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; borderColor: string; label: string }> = {
  CALL: { icon: Phone, label: 'Call', color: 'text-blue-600', borderColor: 'border-blue-400' },
  MEETING: { icon: Users, label: 'Meeting', color: 'text-violet-600', borderColor: 'border-violet-400' },
  TASK: { icon: Building2, label: 'Task', color: 'text-emerald-600', borderColor: 'border-emerald-400' },
  DEADLINE: { icon: Target, label: 'Deadline', color: 'text-red-600', borderColor: 'border-red-400' },
};

interface FocusPanelProps {
  activities: Activity[];
  onMarkDone: (id: string) => void;
  clinicName?: string;
}

export default function FocusPanel({ activities, onMarkDone, clinicName }: FocusPanelProps) {
  const [expandAll, setExpandAll] = useState(true);
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ChevronDown size={12} className={`transition-transform ${expandAll ? '' : '-rotate-90'}`} />
          Focus ({pending.length})
        </button>
      </div>

      {expandAll && pending.map(act => {
        const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
        const Icon = cfg.icon;
        const isOverdue = new Date(act.activity_date) < new Date(new Date().toDateString());

        return (
          <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
            {/* Circular checkbox */}
            <button
              onClick={() => handleDone(act.id)}
              className={`w-5 h-5 rounded-full border-2 ${cfg.borderColor} flex items-center justify-center shrink-0 mt-0.5 hover:bg-muted transition-colors`}
              title="Mark as done"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon size={13} className={cfg.color} />
                <span className="text-xs font-medium text-foreground">{act.title}</span>
                {act.priority === 'HIGH' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">HIGH</span>
                )}
                {isOverdue && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 flex items-center gap-0.5">
                    <AlertTriangle size={9} /> OVERDUE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                <span>{act.activity_date}</span>
                {act.start_time && <span>{act.start_time}{act.end_time ? ` - ${act.end_time}` : ''}</span>}
              </div>

              {clinicName && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {clinicName}
                </p>
              )}

              {act.notes && (
                <p className="text-[10px] text-muted-foreground mt-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
                  {act.notes}
                </p>
              )}
            </div>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => handleDone(act.id)}>✅ Mark as done</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">🗑 ลบกิจกรรม</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}

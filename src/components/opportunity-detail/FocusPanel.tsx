import { useState } from 'react';
import { Phone, Users, Building2, Target, AlertTriangle, MoreHorizontal, ChevronDown, Pencil, Trash2, X, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0');
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  return `${h}:${m}`;
});
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
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onActivityUpdated?: (activity: Activity) => void;
  clinicName?: string;
}

export default function FocusPanel({ activities, onMarkDone, onEdit, onDelete, onActivityUpdated, clinicName }: FocusPanelProps) {
  const [expandAll, setExpandAll] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
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

      {expandAll && pending.map(act => (
        editingId === act.id ? (
          <InlineEditCard
            key={act.id}
            activity={act}
            clinicName={clinicName}
            onSave={(updated) => {
              onActivityUpdated?.(updated);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <FocusCard
            key={act.id}
            activity={act}
            clinicName={clinicName}
            onDone={() => handleDone(act.id)}
            onEdit={() => setEditingId(act.id)}
            onDelete={() => onDelete?.(act.id)}
          />
        )
      ))}
    </div>
  );
}

function FocusCard({ activity: act, clinicName, onDone, onEdit, onDelete }: {
  activity: Activity; clinicName?: string; onDone: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const cfg = TYPE_CONFIG[act.activity_type] || TYPE_CONFIG.TASK;
  const Icon = cfg.icon;
  const isOverdue = new Date(act.activity_date) < new Date(new Date().toDateString());

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group">
      <button
        onClick={onDone}
        className={`w-5 h-5 rounded-full border-2 ${cfg.borderColor} flex items-center justify-center shrink-0 mt-0.5 hover:bg-muted transition-colors`}
        title="Mark as done"
      />
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
        {clinicName && <p className="text-[10px] text-muted-foreground mt-0.5">{clinicName}</p>}
        {act.notes && (
          <p className="text-[10px] text-muted-foreground mt-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1">
            {act.notes}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
            <MoreHorizontal size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={11} className="mr-1.5" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 size={11} className="mr-1.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function InlineEditCard({ activity, clinicName, onSave, onCancel }: {
  activity: Activity; clinicName?: string; onSave: (a: Activity) => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState(activity.title);
  const [date, setDate] = useState(activity.activity_date);
  const [startTime, setStartTime] = useState(activity.start_time || '');
  const [endTime, setEndTime] = useState(activity.end_time || '');
  const [notes, setNotes] = useState(activity.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const updates = {
      title: title.trim(),
      activity_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      notes: notes.trim() || null,
    };
    const { error } = await supabase.from('activities').update(updates).eq('id', activity.id);
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('อัปเดตกิจกรรมแล้ว');
    onSave({ ...activity, ...updates });
  };

  const cfg = TYPE_CONFIG[activity.activity_type] || TYPE_CONFIG.TASK;
  const Icon = cfg.icon;

  return (
    <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className={cfg.color} />
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="h-7 text-xs font-medium flex-1"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-2">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-7 text-[10px] w-[130px]" />
        <Select value={startTime} onValueChange={setStartTime}>
          <SelectTrigger className="h-7 text-[10px] w-[90px]"><SelectValue placeholder="เริ่ม" /></SelectTrigger>
          <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">-</span>
        <Select value={endTime} onValueChange={setEndTime}>
          <SelectTrigger className="h-7 text-[10px] w-[90px]"><SelectValue placeholder="สิ้นสุด" /></SelectTrigger>
          <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {clinicName && <p className="text-[10px] text-muted-foreground">{clinicName}</p>}
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notes..."
        className="text-[10px] min-h-[36px] resize-none"
      />
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={onCancel} disabled={saving}>
          <X size={10} className="mr-0.5" /> Cancel
        </Button>
        <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSave} disabled={saving || !title.trim()}>
          <Check size={10} className="mr-0.5" /> Save
        </Button>
      </div>
    </div>
  );
}

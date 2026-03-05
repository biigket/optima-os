import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Users, Building2, Target, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, ActivityType, ActivityPriority } from '@/types';

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { type: 'CALL', label: 'Call', icon: Phone, color: 'text-blue-600 bg-blue-100' },
  { type: 'MEETING', label: 'Meeting', icon: Users, color: 'text-violet-600 bg-violet-100' },
  { type: 'TASK', label: 'Task', icon: Building2, color: 'text-emerald-600 bg-emerald-100' },
  { type: 'DEADLINE', label: 'Deadline', icon: Target, color: 'text-red-600 bg-red-100' },
];

interface ActivityFormProps {
  opportunityId: string;
  accountId: string;
  onActivityCreated: (activity: Activity) => void;
}

export default function ActivityForm({ opportunityId, accountId, onActivityCreated }: ActivityFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>('CALL');
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<ActivityPriority>('NORMAL');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsDone, setMarkAsDone] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setStartTime('');
    setEndTime('');
    setPriority('NORMAL');
    setLocation('');
    setDescription('');
    setNotes('');
    setMarkAsDone(false);
    setShowExtra(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('กรุณากรอกชื่อกิจกรรม'); return; }
    setSaving(true);
    const payload = {
      opportunity_id: opportunityId,
      account_id: accountId,
      activity_type: selectedType,
      title: title.trim(),
      activity_date: activityDate,
      start_time: startTime || null,
      end_time: endTime || null,
      priority,
      location: location || null,
      description: description || null,
      notes: notes || null,
      is_done: markAsDone,
    };
    const { data, error } = await supabase.from('activities').insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); console.error(error); return; }
    onActivityCreated(data as unknown as Activity);
    reset();
    setOpen(false);
    toast.success('สร้างกิจกรรมแล้ว');
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => setOpen(true)}>
        <Plus size={14} /> เพิ่มกิจกรรม
      </Button>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">สร้างกิจกรรมใหม่</p>

      {/* Type selector */}
      <div className="flex gap-1">
        {ACTIVITY_TYPES.map(at => {
          const Icon = at.icon;
          const active = selectedType === at.type;
          return (
            <button
              key={at.type}
              onClick={() => setSelectedType(at.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${active ? at.color + ' ring-1 ring-offset-1 ring-current' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              <Icon size={13} /> {at.label}
            </button>
          );
        })}
      </div>

      {/* Title */}
      <Input
        placeholder="ชื่อกิจกรรม เช่น โทรติดตาม, ประชุมปิดดีล..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-9 text-sm"
      />

      {/* Date & Time row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground">วันที่</label>
          <Input type="date" value={activityDate} onChange={e => setActivityDate(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">เริ่ม</label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">สิ้นสุด</label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-[10px] text-muted-foreground">ความสำคัญ</label>
        <Select value={priority} onValueChange={v => setPriority(v as ActivityPriority)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW" className="text-xs">Low</SelectItem>
            <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
            <SelectItem value="HIGH" className="text-xs">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Toggle extra fields */}
      <button onClick={() => setShowExtra(!showExtra)} className="text-[11px] text-primary flex items-center gap-1 hover:underline">
        {showExtra ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showExtra ? 'ซ่อนรายละเอียดเพิ่มเติม' : 'เพิ่ม Location, Description'}
      </button>

      {showExtra && (
        <div className="space-y-2">
          <Input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="h-8 text-xs" />
          <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="text-xs min-h-[50px]" />
        </div>
      )}

      {/* Notes (yellow) */}
      <div>
        <label className="text-[10px] text-muted-foreground">Notes</label>
        <Textarea
          placeholder="บันทึกเพิ่มเติม..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="text-xs min-h-[50px] bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        />
      </div>

      {/* Footer: Mark as done + buttons */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <Checkbox checked={markAsDone} onCheckedChange={v => setMarkAsDone(!!v)} />
          Mark as done
        </label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { reset(); setOpen(false); }}>ยกเลิก</Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </div>
  );
}

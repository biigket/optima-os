import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Phone, Users, Building2, Target, Presentation, ChevronDown, ChevronUp, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Activity, ActivityType, ActivityPriority } from '@/types';

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0');
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  return `${h}:${m}`;
});

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ElementType; color: string; defaultTitle: string }[] = [
  { type: 'CALL', label: 'Call', icon: Phone, color: 'text-blue-600 bg-blue-100', defaultTitle: 'โทร' },
  { type: 'MEETING', label: 'Visit', icon: Users, color: 'text-violet-600 bg-violet-100', defaultTitle: 'นัดพบ' },
  { type: 'TASK', label: 'Task', icon: Building2, color: 'text-emerald-600 bg-emerald-100', defaultTitle: 'งาน' },
  { type: 'DEADLINE', label: 'Deadline', icon: Target, color: 'text-red-600 bg-red-100', defaultTitle: 'เส้นตาย' },
  { type: 'DEMO', label: 'Demo', icon: Presentation, color: 'text-orange-600 bg-orange-100', defaultTitle: 'นัดเดโม' },
];

interface QuickScheduleDefaults {
  start_time: string;
  end_time: string;
  activity_date: string;
}

interface ActivityFormProps {
  opportunityId: string;
  accountId: string;
  onActivityCreated: (activity: Activity) => void;
  editingActivity?: Activity | null;
  onActivityUpdated?: (activity: Activity) => void;
  onCancelEdit?: () => void;
  onFormChange?: (preview: Partial<Activity>) => void;
  quickScheduleDefaults?: QuickScheduleDefaults | null;
  defaultType?: ActivityType | null;
}

export default function ActivityForm({
  opportunityId, accountId, onActivityCreated,
  editingActivity, onActivityUpdated, onCancelEdit, onFormChange,
  quickScheduleDefaults, defaultType,
}: ActivityFormProps) {
  const [selectedType, setSelectedType] = useState<ActivityType>(defaultType || 'CALL');
  const [title, setTitle] = useState('');
  const [activityDate, setActivityDate] = useState(quickScheduleDefaults?.activity_date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(quickScheduleDefaults?.start_time || '');
  const [endTime, setEndTime] = useState(quickScheduleDefaults?.end_time || '');
  const [priority, setPriority] = useState<ActivityPriority>('NORMAL');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsDone, setMarkAsDone] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingActivity;

  // Populate form when editingActivity changes
  useEffect(() => {
    if (editingActivity) {
      setSelectedType(editingActivity.activity_type);
      setTitle(editingActivity.title);
      setActivityDate(editingActivity.activity_date);
      setStartTime(editingActivity.start_time || '');
      setEndTime(editingActivity.end_time || '');
      setPriority((editingActivity.priority as ActivityPriority) || 'NORMAL');
      setLocation(editingActivity.location || '');
      setDescription(editingActivity.description || '');
      setNotes(editingActivity.notes || '');
      setMarkAsDone(editingActivity.is_done || false);
      if (editingActivity.location || editingActivity.description) setShowExtra(true);
    }
  }, [editingActivity?.id]);

  // Apply quick schedule defaults
  useEffect(() => {
    if (quickScheduleDefaults && !editingActivity) {
      setStartTime(quickScheduleDefaults.start_time);
      setEndTime(quickScheduleDefaults.end_time);
      setActivityDate(quickScheduleDefaults.activity_date);
    }
  }, [quickScheduleDefaults?.start_time, quickScheduleDefaults?.end_time, quickScheduleDefaults?.activity_date]);
  // Apply defaultType when set externally
  useEffect(() => {
    if (defaultType && !editingActivity) {
      setSelectedType(defaultType);
      const typeConfig = ACTIVITY_TYPES.find(a => a.type === defaultType);
      if (typeConfig && (!title.trim() || ACTIVITY_TYPES.some(a => a.defaultTitle === title))) {
        setTitle(typeConfig.defaultTitle);
      }
    }
  }, [defaultType]);


  useEffect(() => {
    if (!onFormChange) return;
    onFormChange({
      activity_type: selectedType,
      title,
      activity_date: activityDate,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      priority,
      is_done: markAsDone,
    });
  }, [selectedType, title, activityDate, startTime, endTime, priority, markAsDone]);

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

    if (isEditing && editingActivity) {
      // Update existing
      const { data, error } = await supabase
        .from('activities')
        .update(payload)
        .eq('id', editingActivity.id)
        .select()
        .single();
      setSaving(false);
      if (error) { toast.error('อัปเดตไม่สำเร็จ'); console.error(error); return; }
      onActivityUpdated?.(data as unknown as Activity);
      reset();
      toast.success('อัปเดตกิจกรรมแล้ว');
    } else {
      // Create new
      const { data, error } = await supabase.from('activities').insert(payload).select().single();
      setSaving(false);
      if (error) { toast.error('บันทึกไม่สำเร็จ'); console.error(error); return; }
      onActivityCreated(data as unknown as Activity);
      reset();
      toast.success('สร้างกิจกรรมแล้ว');
    }
  };

  const handleCancel = () => {
    reset();
    onCancelEdit?.();
  };

  return (
    <div className="space-y-3">
      {isEditing && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-[11px] text-primary font-medium">✏️ กำลังแก้ไข: {editingActivity?.title}</span>
          <button onClick={handleCancel} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">ยกเลิก</button>
        </div>
      )}

      {/* Type selector */}
      <div className="flex gap-1">
        {ACTIVITY_TYPES.map(at => {
          const Icon = at.icon;
          const active = selectedType === at.type;
          return (
            <button
              key={at.type}
              onClick={() => {
                setSelectedType(at.type);
                const currentDefault = ACTIVITY_TYPES.find(a => a.type === selectedType)?.defaultTitle;
                if (!title.trim() || title === currentDefault) {
                  setTitle(at.defaultTitle);
                }
              }}
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("h-8 w-full justify-start text-xs font-normal", !activityDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {activityDate ? format(parse(activityDate, 'yyyy-MM-dd', new Date()), 'dd MMM yyyy') : 'เลือกวันที่'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={activityDate ? parse(activityDate, 'yyyy-MM-dd', new Date()) : undefined}
                onSelect={d => d && setActivityDate(format(d, 'yyyy-MM-dd'))}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">เริ่ม</label>
          <Select value={startTime || undefined} onValueChange={setStartTime}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="--:--" /></SelectTrigger>
            <SelectContent className="max-h-48">
              {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">สิ้นสุด</label>
          <Select value={endTime || undefined} onValueChange={setEndTime}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="--:--" /></SelectTrigger>
            <SelectContent className="max-h-48">
              {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
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
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={handleCancel}>ยกเลิก</Button>
          <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : isEditing ? 'อัปเดต' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </div>
  );
}

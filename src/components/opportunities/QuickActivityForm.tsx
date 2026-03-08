import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncDemoFromActivity } from '@/lib/demoSync';

const TITLE_MAP: Record<string, string> = {
  CALL: 'โทร',
  MEETING: 'นัดพบ',
  DEMO: 'นัดเดโม',
};

const TIME_OPTIONS = Array.from({ length: 4 * 24 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

const PRODUCT_SPECIALISTS = ['Not', 'Ohm', 'Por'];

interface Props {
  activityType: 'CALL' | 'MEETING' | 'DEMO';
  opportunityId: string;
  accountId: string;
  onSaved: () => void;
  onClose: () => void;
}

export default function QuickActivityForm({ activityType, opportunityId, accountId, onSaved, onClose }: Props) {
  const isDemo = activityType === 'DEMO';

  const [title, setTitle] = useState(TITLE_MAP[activityType] || '');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState(isDemo ? 'HIGH' : 'NORMAL');
  const [location, setLocation] = useState('');
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSpecialist = (name: string) => {
    setSelectedSpecialists(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const googleMapUrl = location.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`
    : '';

  const handleSave = async () => {
    if (!date || !title.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (isDemo && !location.trim()) {
      toast.error('กรุณากรอกสถานที่สาธิต');
      return;
    }

    // Build description with location + Google Map link
    let description = '';
    if (location.trim()) {
      description = `📍 สถานที่: ${location.trim()}`;
      if (googleMapUrl) {
        description += `\n🗺️ Google Map: ${googleMapUrl}`;
      }
    }
    if (selectedSpecialists.length > 0) {
      description += `${description ? '\n' : ''}👤 Product Specialist: ${selectedSpecialists.join(', ')}`;
    }

    setSaving(true);
    const assignedTo = selectedSpecialists.length > 0 ? selectedSpecialists : null;

    const { error } = await supabase.from('activities').insert({
      opportunity_id: opportunityId,
      account_id: accountId,
      activity_type: activityType,
      title: title.trim(),
      activity_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      priority,
      is_done: false,
      location: location.trim() || null,
      description: description || null,
      assigned_to: assignedTo,
    });
    setSaving(false);
    if (error) {
      toast.error('บันทึกไม่สำเร็จ');
      return;
    }

    // Auto-create demo record + move pipeline when activity is DEMO
    if (isDemo && date) {
      await syncDemoFromActivity({
        accountId,
        opportunityId,
        demoDate: format(date, 'yyyy-MM-dd'),
        location: location.trim() || undefined,
        visitedBy: selectedSpecialists.length > 0 ? selectedSpecialists : undefined,
      });
      toast.success('บันทึกกิจกรรม + ใบงาน Demo แล้ว');
    } else {
      toast.success('บันทึกกิจกรรมแล้ว');
    }
    onSaved();
    onClose();
  };

  return (
    <div className="space-y-3 w-[260px]" onClick={e => e.stopPropagation()}>
      <div>
        <Label className="text-[11px] text-muted-foreground">ชื่อกิจกรรม</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="h-7 text-xs mt-1" />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">วันที่</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full h-7 text-xs justify-start mt-1", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {date ? format(date, 'd MMM yyyy') : 'เลือกวันที่'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] text-muted-foreground">เริ่ม</Label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-48">
              {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">สิ้นสุด</Label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-48">
              {TIME_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location - required for DEMO */}
      {isDemo && (
        <div>
          <Label className="text-[11px] text-muted-foreground">
            สถานที่ <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <MapPin size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="h-7 text-xs mt-1 pl-6"
              placeholder="เช่น คลินิก ABC, กรุงเทพ..."
            />
          </div>
          {location.trim() && (
            <a
              href={googleMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-1"
            >
              <ExternalLink size={10} /> เปิด Google Map
            </a>
          )}
        </div>
      )}

      {/* Product Specialist - DEMO only */}
      {isDemo && (
        <div>
          <Label className="text-[11px] text-muted-foreground">Assign to Product Specialist</Label>
          <div className="flex gap-2 mt-1">
            {PRODUCT_SPECIALISTS.map(name => (
              <label key={name} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={selectedSpecialists.includes(name)}
                  onCheckedChange={() => toggleSpecialist(name)}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Priority - locked to HIGH for DEMO */}
      <div>
        <Label className="text-[11px] text-muted-foreground">ความสำคัญ</Label>
        {isDemo ? (
          <div className="mt-1 px-2 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
            HIGH
          </div>
        ) : (
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW" className="text-xs">Low</SelectItem>
              <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
              <SelectItem value="HIGH" className="text-xs">High</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={onClose}>ยกเลิก</Button>
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </div>
    </div>
  );
}

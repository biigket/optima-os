import { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Presentation, Users, Clock, Trash2, FileText, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { format, parse } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEMO_PRODUCTS = ['Doublo', 'Trica3D', 'Quattro', 'PicoHi'];
const PRODUCT_SPECIALISTS = ['Not', 'Ohm', 'Por'];

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0');
  const m = String((i % 4) * 15).padStart(2, '0');
  return `${h}:${m}`;
});

interface DemoRow {
  id: string;
  account_id: string | null;
  opportunity_id: string | null;
  demo_date: string | null;
  location: string | null;
  products_demo: string[] | null;
  demo_note: string | null;
  visited_by: string[] | null;
  reminded: boolean | null;
  created_at: string;
}

interface EditDemoDialogProps {
  demo: DemoRow | null;
  clinicName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export default function EditDemoDialog({ demo, clinicName, open, onOpenChange, onSaved, onDeleted }: EditDemoDialogProps) {
  const [demoDate, setDemoDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [visitedBy, setVisitedBy] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (demo && open) {
      setDemoDate(demo.demo_date ? parse(demo.demo_date, 'yyyy-MM-dd', new Date()) : undefined);
      setLocation(demo.location || '');
      setNote(demo.demo_note || '');
      setSelectedProducts(demo.products_demo || []);
      setVisitedBy(demo.visited_by || []);
      // Try to find start/end time from linked activity
      fetchActivityTimes(demo.id, demo.opportunity_id, demo.demo_date);
    }
  }, [demo, open]);

  async function fetchActivityTimes(demoId: string, oppId: string | null, demoDate: string | null) {
    if (!oppId || !demoDate) return;
    const { data } = await supabase
      .from('activities')
      .select('start_time, end_time, location, description')
      .eq('opportunity_id', oppId)
      .eq('activity_type', 'DEMO')
      .eq('activity_date', demoDate)
      .limit(1)
      .maybeSingle();
    if (data) {
      setStartTime(data.start_time || '09:00');
      setEndTime(data.end_time || '10:00');
      // Fallback: use activity location/description if demo record is missing them
      if (!location && data.location) setLocation(data.location);
      if (!note && data.description) setNote(data.description);
    }
  }

  function toggleProduct(name: string) {
    setSelectedProducts(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  }

  function toggleSpecialist(name: string) {
    setVisitedBy(prev => {
      // Keep non-specialist names, toggle the specialist
      const specialists = PRODUCT_SPECIALISTS;
      const nonSpecialists = prev.filter(n => !specialists.includes(n));
      const currentSpecialists = prev.filter(n => specialists.includes(n));
      const updated = currentSpecialists.includes(name)
        ? currentSpecialists.filter(s => s !== name)
        : [...currentSpecialists, name];
      return [...nonSpecialists, ...updated];
    });
  }

  async function handleSave() {
    if (!demo) return;
    if (!demoDate) { toast.error('กรุณาเลือกวันที่'); return; }
    if (!location.trim()) { toast.error('กรุณาระบุสถานที่'); return; }

    setSaving(true);
    const dateStr = format(demoDate, 'yyyy-MM-dd');

    const { error } = await supabase.from('demos').update({
      demo_date: dateStr,
      location: location.trim() || null,
      demo_note: note.trim() || null,
      products_demo: selectedProducts.length > 0 ? selectedProducts : null,
      visited_by: visitedBy.length > 0 ? visitedBy : null,
    }).eq('id', demo.id);

    if (error) {
      setSaving(false);
      toast.error('บันทึกไม่สำเร็จ');
      return;
    }

    // Always sync to linked DEMO activity
    if (demo.opportunity_id) {
      const descParts: string[] = [];
      if (location) descParts.push(`📍 สถานที่: ${location}`);
      if (selectedProducts.length > 0) descParts.push(`🎯 สินค้า: ${selectedProducts.join(', ')}`);
      const specialists = visitedBy.filter(n => PRODUCT_SPECIALISTS.includes(n));
      if (specialists.length > 0) descParts.push(`👤 Specialist: ${specialists.join(', ')}`);
      if (location) descParts.push(`🗺️ Google Map: https://www.google.com/maps/search/${encodeURIComponent(location)}`);
      if (note) descParts.push(`📝 ${note}`);

      // Find the linked activity by opportunity + type, with or without date
      let activityQuery = supabase.from('activities')
        .update({
          activity_date: dateStr,
          start_time: startTime,
          end_time: endTime,
          location: location.trim() || null,
          description: descParts.join('\n') || null,
          assigned_to: visitedBy.length > 0 ? visitedBy : null,
        })
        .eq('opportunity_id', demo.opportunity_id)
        .eq('activity_type', 'DEMO');

      // If original date exists, match by it; otherwise match any DEMO activity for this opportunity
      if (demo.demo_date) {
        activityQuery = activityQuery.eq('activity_date', demo.demo_date);
      }

      await activityQuery;
    }

    setSaving(false);
    toast.success('อัปเดตใบงาน Demo แล้ว');
    onSaved();
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!demo) return;
    setDeleting(true);

    // Delete linked DEMO activity first
    if (demo.opportunity_id && demo.demo_date) {
      await supabase.from('activities')
        .delete()
        .eq('opportunity_id', demo.opportunity_id)
        .eq('activity_type', 'DEMO')
        .eq('activity_date', demo.demo_date);
    }

    const { error } = await supabase.from('demos').delete().eq('id', demo.id);
    setDeleting(false);

    if (error) {
      toast.error('ลบไม่สำเร็จ');
      return;
    }

    toast.success('ลบใบงาน Demo แล้ว');
    onDeleted();
    onOpenChange(false);
  }

  if (!demo) return null;

  const currentSpecialists = visitedBy.filter(n => PRODUCT_SPECIALISTS.includes(n));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation size={18} className="text-orange-600" />
            แก้ไขใบงาน Demo
          </DialogTitle>
          <DialogDescription className="sr-only">แก้ไขข้อมูลใบงานสาธิตสินค้า</DialogDescription>
          <p className="text-sm text-muted-foreground font-medium">{clinicName}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">วันที่สาธิต *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start h-9 text-sm", !demoDate && "text-muted-foreground")}>
                  <Calendar size={14} className="mr-2" />
                  {demoDate ? format(demoDate, 'd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={demoDate}
                  onSelect={setDemoDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">เวลาเริ่ม</Label>
              <Select value={startTime} onValueChange={v => {
                setStartTime(v);
                if (v >= endTime) {
                  const idx = TIME_OPTIONS.indexOf(v);
                  setEndTime(TIME_OPTIONS[Math.min(idx + 4, TIME_OPTIONS.length - 1)]);
                }
              }}>
                <SelectTrigger className="h-9 text-sm">
                  <Clock size={12} className="mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เวลาสิ้นสุด</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="h-9 text-sm">
                  <Clock size={12} className="mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <MapPin size={12} className="text-muted-foreground" />
              Location <span className="text-destructive">*</span>
            </Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="เช่น คลินิก ABC, กรุงเทพ..." />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="ใส่ลิงก์ Google Map หรือรายละเอียดเพิ่มเติม..."
              className="min-h-[60px] text-xs"
            />
          </div>

          {/* Demo Products */}
          <div className="space-y-1.5">
            <Label className="text-xs">สินค้าที่สาธิต</Label>
            <div className="flex flex-wrap gap-2">
              {DEMO_PRODUCTS.map(name => (
                <label key={name} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={selectedProducts.includes(name)} onCheckedChange={() => toggleProduct(name)} />
                  <span className="text-xs">{name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specialists */}
          <div className="space-y-1.5">
            <Label className="text-xs">Product Specialist</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_SPECIALISTS.map(name => (
                <label key={name} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={currentSpecialists.includes(name)} onCheckedChange={() => toggleSpecialist(name)} />
                  <span className="text-xs">{name}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                <Trash2 size={14} /> ลบ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ลบใบงาน Demo?</AlertDialogTitle>
                <AlertDialogDescription>
                  ระบบจะลบใบงาน Demo และ Activity ที่เกี่ยวข้อง การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? 'กำลังลบ...' : 'ลบ'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

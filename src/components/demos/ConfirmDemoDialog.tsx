import { useState } from 'react';
import { CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TIME_OPTIONS = Array.from({ length: 61 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 15;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});

interface ConfirmDemoDialogProps {
  demoId: string;
  currentDate: string | null;
  opportunityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

export default function ConfirmDemoDialog({
  demoId, currentDate, opportunityId, open, onOpenChange, onConfirmed,
}: ConfirmDemoDialogProps) {
  const [confirmDate, setConfirmDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate) : undefined
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!confirmDate) { toast.error('กรุณาเลือกวันที่'); return; }

    setSaving(true);
    const dateStr = format(confirmDate, 'yyyy-MM-dd');

    // Update demo record
    const { error } = await supabase.from('demos').update({
      demo_date: dateStr,
      confirmed: true,
    }).eq('id', demoId);

    if (error) {
      setSaving(false);
      toast.error('ยืนยันไม่สำเร็จ');
      return;
    }

    // Sync to linked DEMO activity
    if (opportunityId) {
      await supabase.from('activities')
        .update({
          activity_date: dateStr,
          start_time: startTime,
          end_time: endTime,
        })
        .eq('opportunity_id', opportunityId)
        .eq('activity_type', 'DEMO');

      // Move opportunity to DEMO_SCHEDULED stage
      const { data: opp } = await supabase
        .from('opportunities')
        .select('stage')
        .eq('id', opportunityId)
        .maybeSingle();

      if (opp && opp.stage === 'CONTACTED') {
        await supabase
          .from('opportunities')
          .update({ stage: 'DEMO_SCHEDULED' })
          .eq('id', opportunityId);

        await supabase.from('opportunity_stage_history').insert({
          opportunity_id: opportunityId,
          from_stage: 'CONTACTED',
          to_stage: 'DEMO_SCHEDULED',
          changed_by: 'system (demo confirmed)',
        });
      }
    }

    setSaving(false);
    toast.success('ยืนยันวันเดโมแล้ว');
    onConfirmed();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            ยืนยันวันเดโม
          </DialogTitle>
          <DialogDescription>เลือกวันและเวลาที่ได้คิวเดโมแล้ว</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs">วันที่เดโม *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start h-9 text-sm", !confirmDate && "text-muted-foreground")}>
                  <CalendarIcon size={14} className="mr-2" />
                  {confirmDate ? format(confirmDate, 'd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={confirmDate}
                  onSelect={setConfirmDate}
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
                <SelectContent className="max-h-48">
                  {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">เวลาสิ้นสุด</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="h-9 text-sm">
                  <Clock size={12} className="mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button size="sm" onClick={handleConfirm} disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 size={14} />
            {saving ? 'กำลังยืนยัน...' : 'ยืนยันวันเดโม'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

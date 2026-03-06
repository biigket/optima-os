import { Phone, Circle, CheckCircle2, Clock, MapPin, CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';

interface ActivityRow {
  id: string;
  title: string;
  activity_type: string;
  activity_date: string;
  start_time: string | null;
  end_time: string | null;
  priority: string | null;
  is_done: boolean | null;
  opportunity_id: string;
  account_id: string;
  opp_stage: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  clinic_name: string | null;
}

interface CalendarEventDialogProps {
  activity: ActivityRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleDone: (id: string, currentDone: boolean) => void;
}

const activityTypeLabels: Record<string, string> = {
  CALL: 'โทร',
  MEETING: 'ประชุม',
  TASK: 'งาน',
  DEADLINE: 'เดดไลน์',
  DEMO: 'สาธิต',
};

const formatTime12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

export default function CalendarEventDialog({ activity, open, onOpenChange, onToggleDone }: CalendarEventDialogProps) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Activity type & clinic */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">ประเภท:</span>
            <span className="font-medium">{activityTypeLabels[activity.activity_type] || activity.activity_type}</span>
          </div>

          {activity.clinic_name && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-muted-foreground shrink-0" />
              <span>{activity.clinic_name}</span>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays size={14} className="text-muted-foreground shrink-0" />
            <span>{new Date(activity.activity_date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          {activity.start_time && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-muted-foreground shrink-0" />
              <span>
                {formatTime12(activity.start_time)}
                {activity.end_time ? ` – ${formatTime12(activity.end_time)}` : ''}
              </span>
            </div>
          )}

          {/* Contact */}
          {activity.contact_name && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-muted-foreground shrink-0" />
              <span>{activity.contact_name}</span>
              {activity.contact_phone && (
                <a href={`tel:${activity.contact_phone}`} className="text-primary hover:text-primary/80 text-xs underline">
                  {activity.contact_phone}
                </a>
              )}
            </div>
          )}

          {/* Priority & Stage */}
          <div className="flex items-center gap-3 flex-wrap">
            {activity.priority && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">ความสำคัญ:</span>
                <StatusBadge status={activity.priority} />
              </div>
            )}
            {activity.opp_stage && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Stage:</span>
                <StatusBadge status={activity.opp_stage} />
              </div>
            )}
          </div>

          {/* Status & Toggle */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">สถานะ:</span>
            {activity.is_done ? (
              <span className="flex items-center gap-1 text-success font-medium">
                <CheckCircle2 size={16} /> เสร็จแล้ว
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground font-medium">
                <Circle size={16} /> ยังไม่เสร็จ
              </span>
            )}
          </div>

          <Button
            variant={activity.is_done ? 'outline' : 'default'}
            className="w-full"
            onClick={() => onToggleDone(activity.id, !!activity.is_done)}
          >
            {activity.is_done ? (
              <><Circle size={16} className="mr-2" /> ยกเลิกเสร็จ</>
            ) : (
              <><CheckCircle2 size={16} className="mr-2" /> ทำเครื่องหมายเสร็จ</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

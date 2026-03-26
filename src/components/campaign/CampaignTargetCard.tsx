import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, ExternalLink, MapPin, MessageCircle, CheckCircle2, Clock, XCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS, NEXT_STEP_PLACEHOLDERS } from '@/pages/CampaignTrackerPage';

interface CampaignTargetCardProps {
  target: any;
  isManager: boolean;
  onSave: (id: string, data: { contact_status: string; next_step: string; next_step_date: string }) => Promise<void>;
}

export default function CampaignTargetCard({ target, isManager, onSave }: CampaignTargetCardProps) {
  const [editStatus, setEditStatus] = useState(target.contact_status);
  const [nextStep, setNextStep] = useState(target.next_step || '');
  const [nextStepDate, setNextStepDate] = useState(target.next_step_date || '');
  const [saving, setSaving] = useState(false);

  const isDirty = editStatus !== target.contact_status ||
    nextStep !== (target.next_step || '') ||
    nextStepDate !== (target.next_step_date || '');

  const handleStatusChange = (newStatus: string) => {
    setEditStatus(newStatus);
    // Clear next_step if user hasn't typed anything custom yet
    if (!nextStep || nextStep === '') {
      // Leave empty so placeholder shows
    }
  };

  const handleSave = async () => {
    // Validation: require next_step and next_step_date
    if (!nextStep.trim() || !nextStepDate) {
      toast.error('โปรดกรอก Next step และวันที่นัดถัดไปก่อนบันทึก');
      return;
    }
    setSaving(true);
    await onSave(target.id, { contact_status: editStatus, next_step: nextStep.trim(), next_step_date: nextStepDate });
    setSaving(false);
  };

  const placeholder = NEXT_STEP_PLACEHOLDERS[editStatus] || '';

  return (
    <Card className={cn(
      "transition-all",
      editStatus === 'เยี่ยมแล้ว' && 'border-green-200 bg-green-50/30',
      editStatus === 'สนใจ' && 'border-emerald-200 bg-emerald-50/30',
      editStatus === 'ปิดดีลแล้ว' && 'border-purple-200 bg-purple-50/30',
      editStatus === 'ไม่สนใจ' && 'opacity-60',
    )}>
      <CardContent className="p-3 space-y-2">
        {/* Row 1: Clinic info + status */}
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{target.clinic_name}</span>
              {isManager && <Badge variant="outline" className="text-[10px] shrink-0">{target.zone} · {target.assigned_sale}</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {target.province && <span className="flex items-center gap-0.5"><MapPin size={11} />{target.province}</span>}
              {target.phone && target.phone !== '-' && (
                <a href={`tel:${target.phone}`} className="flex items-center gap-0.5 text-blue-600 hover:underline">
                  <Phone size={11} />{target.phone}
                </a>
              )}
              {target.facebook && target.facebook !== '-' && (
                <a href={target.facebook} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-blue-600 hover:underline">
                  <ExternalLink size={11} />FB
                </a>
              )}
              {target.line_id && target.line_id !== '-' && (
                <span className="flex items-center gap-0.5"><MessageCircle size={11} />{target.line_id}</span>
              )}
            </div>
            {target.products_used && (
              <div className="text-[11px] text-muted-foreground mt-1 truncate">🔧 {target.products_used}</div>
            )}
            {target.device_type && (
              <div className="text-[11px] mt-0.5 truncate">{target.device_type}</div>
            )}
          </div>

          <div className="shrink-0">
            <Select value={editStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className={cn("w-[140px] h-8 text-xs",
                STATUS_OPTIONS.find(s => s.value === editStatus)?.color
              )}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.value === 'ยังไม่ติดต่อ' && <Clock className="inline mr-1" size={12} />}
                    {s.value === 'เยี่ยมแล้ว' && <CheckCircle2 className="inline mr-1" size={12} />}
                    {s.value === 'ไม่สนใจ' && <XCircle className="inline mr-1" size={12} />}
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Next step + date + save */}
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-1 min-w-0">
            <label className="text-[11px] text-muted-foreground">Next step</label>
            <Input
              className="h-8 text-xs"
              placeholder={placeholder}
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
            />
          </div>
          <div className="w-[140px] shrink-0">
            <label className="text-[11px] text-muted-foreground">วันที่นัดถัดไป</label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={nextStepDate}
              onChange={e => setNextStepDate(e.target.value)}
            />
          </div>
          {isDirty && (
            <Button size="sm" className="h-8 text-xs shrink-0" onClick={handleSave} disabled={saving}>
              <Save size={14} className="mr-1" />บันทึก
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

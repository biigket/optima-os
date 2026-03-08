import { useState, useEffect } from 'react';
import { Building2, CalendarDays, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuickNoteButtons from '@/components/ui/QuickNoteButtons';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';

interface VisitPlan {
  id: string;
  plan_date: string;
  account_id: string;
  visit_type: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  objective?: string | null;
  products_presented?: string | null;
  notes?: string | null;
  accounts?: { id: string; clinic_name: string; customer_status: string } | null;
}

interface EditVisitPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: VisitPlan | null;
  onSuccess: () => void;
}

const DEFAULT_OBJECTIVES = ['New visit', 'Demo', 'Follow up', 'Training', 'เซนต์สัญญา', 'รับเช็ค'];

const STATUS_LABELS: Record<string, string> = {
  PLANNED: '📋 วางแผนแล้ว',
  CHECKED_IN: '✅ เช็คอินแล้ว',
  REPORTED: '📝 รายงานแล้ว',
};

export default function EditVisitPlanDialog({ open, onOpenChange, plan, onSuccess }: EditVisitPlanDialogProps) {
  const [objective, setObjective] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [productsPresented, setProductsPresented] = useState('');
  const [planNotes, setPlanNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [objectiveOptions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('visit_objective_options');
      return stored ? JSON.parse(stored) : DEFAULT_OBJECTIVES;
    } catch { return DEFAULT_OBJECTIVES; }
  });

  useEffect(() => {
    if (open && plan) {
      const obj = plan.objective || '';
      if (obj && !objectiveOptions.includes(obj)) {
        setObjective('__CUSTOM__');
        setCustomObjective(obj);
      } else {
        setObjective(obj);
        setCustomObjective('');
      }
      setProductsPresented(plan.products_presented || '');
      setPlanNotes(plan.notes || '');
    }
  }, [open, plan]);

  if (!plan) return null;

  const isEditable = plan.status === 'PLANNED';
  const resolvedObjective = objective === '__CUSTOM__' ? customObjective.trim() : objective;

  async function handleSave() {
    if (!plan) return;
    setSaving(true);

    // Save custom objective to localStorage
    if (objective === '__CUSTOM__' && customObjective.trim()) {
      try {
        const stored = localStorage.getItem('visit_objective_options');
        const opts: string[] = stored ? JSON.parse(stored) : DEFAULT_OBJECTIVES;
        if (!opts.includes(customObjective.trim())) {
          opts.push(customObjective.trim());
          localStorage.setItem('visit_objective_options', JSON.stringify(opts));
        }
      } catch {}
    }

    const { error } = await supabase.from('visit_plans').update({
      objective: resolvedObjective || null,
      products_presented: productsPresented.trim() || null,
      notes: planNotes.trim() || null,
    }).eq('id', plan.id);

    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('อัปเดตแผนเยี่ยมแล้ว');
    onSuccess();
    onOpenChange(false);
  }

  async function handleDelete() {
    if (!plan) return;
    if (!confirm(`ลบแผนเยี่ยม "${plan.accounts?.clinic_name}" ?`)) return;
    const { error } = await supabase.from('visit_plans').delete().eq('id', plan.id);
    if (error) { toast.error('ลบไม่สำเร็จ'); return; }
    toast.success('ลบแผนเยี่ยมแล้ว');
    onSuccess();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>รายละเอียดแผนเยี่ยม</DialogTitle>
          <DialogDescription>
            {format(new Date(plan.plan_date + 'T00:00:00'), 'EEEE d MMMM yyyy', { locale: th })} · {plan.start_time || '09:00'} – {plan.end_time || '10:00'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0">
              <Building2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{plan.accounts?.clinic_name || '—'}</p>
              <Badge variant="outline" className="text-[10px] mt-0.5">{STATUS_LABELS[plan.status] || plan.status}</Badge>
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-1.5">
            <Label>เป้าหมายการเยี่ยม</Label>
            {isEditable ? (
              <>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue placeholder="เลือกเป้าหมาย" /></SelectTrigger>
                  <SelectContent>
                    {objectiveOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    <SelectItem value="__CUSTOM__">อื่นๆ (ระบุเอง)</SelectItem>
                  </SelectContent>
                </Select>
                {objective === '__CUSTOM__' && (
                  <Input className="mt-1.5" value={customObjective} onChange={e => setCustomObjective(e.target.value)} placeholder="ระบุเป้าหมาย..." />
                )}
              </>
            ) : (
              <p className="text-sm">{plan.objective || <span className="text-muted-foreground">—</span>}</p>
            )}
          </div>

          {/* Products presented */}
          <div className="space-y-1.5">
            <Label>เครื่องที่นำเสนอ</Label>
            {isEditable ? (
              <>
                <Textarea
                  value={productsPresented}
                  onChange={e => setProductsPresented(e.target.value)}
                  rows={2}
                  placeholder="พิมพ์ชื่อเครื่องที่จะนำเสนอ..."
                />
                <QuickNoteButtons
                  value={productsPresented}
                  onChange={setProductsPresented}
                  storageKey="quick_notes_products_presented"
                  defaults={['Doublo Gold', 'Ultraformer MPT', 'Secret RF', 'Thermage FLX']}
                />
              </>
            ) : (
              <p className="text-sm">{plan.products_presented || <span className="text-muted-foreground">—</span>}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>หมายเหตุ</Label>
            {isEditable ? (
              <Textarea
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
                rows={3}
                placeholder="บันทึกเพิ่มเติม..."
              />
            ) : (
              <p className="text-sm">{plan.notes || <span className="text-muted-foreground">—</span>}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          {isEditable && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto" onClick={handleDelete}>
              <Trash2 size={14} className="mr-1" /> ลบ
            </Button>
          )}
          {isEditable ? (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>ปิด</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

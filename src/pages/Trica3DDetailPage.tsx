import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { mockTrica3DStock, type Trica3DStockItem } from '@/data/trica3dMockData';
import { unifiedStatuses, unifiedStatusColor, type UnifiedStockStatus } from '@/data/unifiedStockStatus';

function StatusChip({ status }: { status: UnifiedStockStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${unifiedStatusColor[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

export default function Trica3DDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = mockTrica3DStock.find(i => i.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Trica3DStockItem | null>(item ?? null);

  if (!item || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">ไม่พบข้อมูลเครื่อง Trica 3D</p>
        <Button variant="outline" onClick={() => navigate('/qc-stock')}>กลับ</Button>
      </div>
    );
  }

  const set = (key: keyof Trica3DStockItem, value: string) => setForm(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = () => {
    if (!form.serialNumber.trim()) { toast.error('กรุณากรอก S/N'); return; }
    const idx = mockTrica3DStock.findIndex(i => i.id === id);
    if (idx !== -1) Object.assign(mockTrica3DStock[idx], form);
    setEditing(false);
    toast.success('บันทึกการแก้ไขเรียบร้อย');
  };

  const handleCancel = () => { setForm({ ...item }); setEditing(false); };

  const Field = ({ label, value, editKey, mono }: { label: string; value: string; editKey?: keyof Trica3DStockItem; mono?: boolean }) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing && editKey ? (
        <Input value={form[editKey] as string} onChange={e => set(editKey, e.target.value)} className={`mt-1 ${mono ? 'font-mono' : ''}`} />
      ) : (
        <p className={`text-sm font-medium text-foreground mt-1 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/qc-stock')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-mono">{item.serialNumber}</h1>
            <p className="text-sm text-muted-foreground">รายละเอียดเครื่อง Trica 3D</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5"><X size={14} /> ยกเลิก</Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5"><Save size={14} /> บันทึก</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5"><Pencil size={14} /> แก้ไข</Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusChip status={form.status} />
        {form.failReason && <span className="text-xs text-destructive">({form.failReason})</span>}
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ข้อมูลเครื่อง
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="S/N Trica" value={form.serialNumber} editKey="serialNumber" mono />
            <Field label="Clinic" value={form.clinic} editKey="clinic" />
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> สถานะ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">STATUS</Label>
              {editing ? (
                <Select value={form.status} onValueChange={v => set('status', v as UnifiedStockStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unifiedStatuses.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1"><StatusChip status={form.status} /></div>
              )}
            </div>
            {editing && (form.status === 'รอซ่อม/รอ QC' || form.status === 'รอเคลม ตปท.') && (
              <Field label="สาเหตุเสีย" value={form.failReason} editKey="failReason" />
            )}
          </div>
        </div>

        <Separator />

        {(form.status === 'DEMO/ยืม' || editing) && (
          <>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> ข้อมูลยืม/DEMO
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ยืมตั้งแต่</Label>
                  {editing ? (
                    <Input type="date" value={form.borrowFrom} onChange={e => set('borrowFrom', e.target.value)} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{form.borrowFrom || '—'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ยืมถึง</Label>
                  {editing ? (
                    <Input type="date" value={form.borrowTo} onChange={e => set('borrowTo', e.target.value)} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{form.borrowTo || '—'}</p>
                  )}
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> ข้อมูลเพิ่มเติม
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">วันรับเข้า Stock</Label>
              {editing ? (
                <Input type="date" value={form.receivedDate} onChange={e => set('receivedDate', e.target.value)} className="mt-1" />
              ) : (
                <p className="text-sm font-medium text-foreground mt-1">{form.receivedDate || '—'}</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">วันที่ติดตั้ง</Label>
              {editing ? (
                <Input type="date" value={form.installDate} onChange={e => set('installDate', e.target.value)} className="mt-1" />
              ) : (
                <p className="text-sm font-medium text-foreground mt-1">{form.installDate || '—'}</p>
              )}
            </div>
            <Field label="Email Trica" value={form.emailTrica} editKey="emailTrica" />
            <Field label="สถานที่เก็บ" value={form.storageLocation} editKey="storageLocation" />
          </div>
          <div className="mt-4">
            <Label className="text-xs text-muted-foreground">หมายเหตุ</Label>
            {editing ? (
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1" />
            ) : (
              <p className="text-sm text-foreground mt-1">{form.notes || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

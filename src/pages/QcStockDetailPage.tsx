import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { mockND2Stock, type ND2StockItem, type QcStatus, type StockStatus, type HrmSellOrKeep } from '@/data/qcMockData';

export default function QcStockDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const item = mockND2Stock.find(i => i.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ND2StockItem | null>(item ?? null);

  if (!item || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">ไม่พบข้อมูลเครื่อง</p>
        <Button variant="outline" onClick={() => navigate('/qc-stock')}>กลับ</Button>
      </div>
    );
  }

  const set = (key: keyof ND2StockItem, value: string) => setForm(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = () => {
    if (!form.hntSerialNumber.trim()) {
      toast.error('กรุณากรอก HNT S/N');
      return;
    }
    // Update mock data in-place
    const idx = mockND2Stock.findIndex(i => i.id === id);
    if (idx !== -1) {
      Object.assign(mockND2Stock[idx], form);
    }
    setEditing(false);
    toast.success('บันทึกการแก้ไขเรียบร้อย');
  };

  const handleCancel = () => {
    setForm({ ...item });
    setEditing(false);
  };

  const Field = ({ label, value, editKey, mono }: { label: string; value: string; editKey?: keyof ND2StockItem; mono?: boolean }) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/qc-stock')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-mono">{item.hntSerialNumber}</h1>
            <p className="text-sm text-muted-foreground">รายละเอียดเครื่อง {item.productType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
                <X size={14} /> ยกเลิก
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1.5">
                <Save size={14} /> บันทึก
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Pencil size={14} /> แก้ไข
            </Button>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-3">
        <StatusBadge status={form.qcResult} />
        <StatusBadge status={form.status} />
        {form.qcResult === 'QC_FAILED' && form.qcFailReason && (
          <span className="text-xs text-destructive">({form.qcFailReason})</span>
        )}
      </div>

      {/* Sections */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        {/* ตัวเครื่อง */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ตัวเครื่อง
          </h3>
          <Field label="HNT S/N ND2" value={form.hntSerialNumber} editKey="hntSerialNumber" mono />
        </div>

        <Separator />

        {/* Handpiece HFL */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Handpiece — HFL
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="1st HFL" value={form.hfl1} editKey="hfl1" mono />
            <Field label="2nd HFL" value={form.hfl2} editKey="hfl2" mono />
          </div>
        </div>

        <Separator />

        {/* Handpiece HSD */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Handpiece — HSD
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="1st HSD" value={form.hsd1} editKey="hsd1" mono />
            <Field label="2nd HSD" value={form.hsd2} editKey="hsd2" mono />
          </div>
        </div>

        <Separator />

        {/* HRM */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Handpiece — HRM
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="HRM S/N" value={form.hrm} editKey="hrm" mono />
            <div>
              <Label className="text-xs text-muted-foreground">HRM ขายหรือเก็บ</Label>
              {editing ? (
                <Select value={form.hrmSellOrKeep} onValueChange={v => set('hrmSellOrKeep', v as HrmSellOrKeep)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ขาย">ขาย</SelectItem>
                    <SelectItem value="เก็บ">เก็บ</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium text-foreground mt-1">{form.hrmSellOrKeep}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* อุปกรณ์เสริม */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> อุปกรณ์เสริม
          </h3>
          <Field label="UPS / Stabilizer" value={form.upsStabilizer} editKey="upsStabilizer" mono />
        </div>

        <Separator />

        {/* สถานะ */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /> สถานะ
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">STATUS</Label>
              {editing ? (
                <Select value={form.status} onValueChange={v => set('status', v as StockStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READY_TO_SELL">พร้อมขาย</SelectItem>
                    <SelectItem value="RESERVED">ติดจอง</SelectItem>
                    <SelectItem value="INSTALLED">ติดตั้งแล้ว</SelectItem>
                    <SelectItem value="SENT_FOR_REPAIR">ส่งซ่อม</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1"><StatusBadge status={form.status} /></div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">ผลตรวจ QC</Label>
              {editing ? (
                <Select value={form.qcResult} onValueChange={v => set('qcResult', v as QcStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_QC">รอ QC</SelectItem>
                    <SelectItem value="QC_PASSED">QC ผ่าน</SelectItem>
                    <SelectItem value="QC_FAILED">QC ไม่ผ่าน</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1"><StatusBadge status={form.qcResult} /></div>
              )}
            </div>
            {editing && form.qcResult === 'QC_FAILED' && (
              <Field label="QC ไม่ผ่านเพราะ" value={form.qcFailReason} editKey="qcFailReason" />
            )}
            {editing && form.status === 'RESERVED' && (
              <Field label="ติดจองที่?" value={form.reservedFor} editKey="reservedFor" />
            )}
            {editing && form.status === 'INSTALLED' && (
              <Field label="Clinic" value={form.clinic} editKey="clinic" />
            )}
          </div>
        </div>

        <Separator />

        {/* ข้อมูลเพิ่มเติม */}
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
            <Field label="สถานที่เก็บเครื่อง" value={form.storageLocation} editKey="storageLocation" />
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

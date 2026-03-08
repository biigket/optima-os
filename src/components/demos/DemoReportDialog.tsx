import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, X, ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Device configs
const DEVICES = [
  { key: 'doublo', label: 'Doublo', hasPatients: true, heads: ['FL', 'SD', 'RM'] },
  { key: 'quattro', label: 'Quattro', hasPatients: true },
  { key: 'picohi', label: 'Picohi', hasPatients: true },
  { key: 'trica3d', label: 'Trica3D', hasPatients: false },
] as const;

type DeviceKey = typeof DEVICES[number]['key'];

// Quick note presets per field type
const QUICK_NOTES: Record<string, string[]> = {
  parameters: ['Full face', 'Jawline', 'Double chin', 'Nasolabial fold', 'Forehead', 'Eye area', 'Neck', 'Body'],
  feeling: ['แทบไม่เจ็บ', 'เจ็บเล็กน้อย', 'เจ็บปานกลาง', 'เจ็บมากทนได้', 'คนไข้พอใจ', 'เห็นผลทันที', 'ต้องการทำซ้ำ', 'หน้าตึง', 'ผิวกระจ่างขึ้น'],
  presentation: ['แนะนำ Treatment protocol', 'เปรียบเทียบกับคู่แข่ง', 'อธิบาย ROI', 'แนะนำ Package', 'เสนอราคาพิเศษ', 'ให้ข้อมูลไฟแนนซ์', 'หมอสนใจมาก', 'ต้อง Follow up'],
};

const SATISFACTION_OPTIONS = ['พอใจมาก', 'พอใจ', 'เฉยๆ', 'ไม่พอใจ'];
const SIDE_EFFECTS = ['ไม่มี', 'บวมเล็กน้อย', 'แดง', 'ชา', 'ปวด', 'จ้ำเลือด'];

interface PatientEntry {
  id: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
  parameters: string;
  feeling: string;
  painScore: number;
  satisfaction: string;
  sideEffects: string[];
  presentationNotes: string;
}

interface DeviceReport {
  patients: PatientEntry[];
  presentationNotes?: string; // for Trica3D only
}

function createPatient(): PatientEntry {
  return {
    id: crypto.randomUUID(),
    beforePhoto: null,
    afterPhoto: null,
    parameters: '',
    feeling: '',
    painScore: 3,
    satisfaction: '',
    sideEffects: [],
    presentationNotes: '',
  };
}

// Quick note buttons component
function QuickNoteField({
  label,
  value,
  onChange,
  quickNoteKey,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  quickNoteKey: string;
  placeholder?: string;
}) {
  const notes = QUICK_NOTES[quickNoteKey] || [];
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {notes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {notes.map(n => (
            <button
              key={n}
              type="button"
              className="px-2 py-0.5 text-[10px] rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors"
              onClick={() => {
                const current = value.trim();
                if (current.includes(n)) return;
                onChange(current ? `${current}\n${n}` : n);
              }}
            >
              + {n}
            </button>
          ))}
        </div>
      )}
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[60px] text-xs"
      />
    </div>
  );
}

// Photo upload component
function PhotoUpload({
  label,
  value,
  onChange,
  demoId,
  photoType,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  demoId: string;
  photoType: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `demo-reports/${demoId}/${photoType}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('checkin-photos').upload(path, file);
    if (error) {
      toast.error('อัปโหลดรูปไม่สำเร็จ');
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('checkin-photos').getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative w-20 h-20 rounded-md overflow-hidden border group">
          <img src={value} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-md text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          <Camera size={16} />
          <span className="text-[9px] mt-0.5">{uploading ? 'กำลัง...' : 'เพิ่มรูป'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}

// Patient card component
function PatientCard({
  patient,
  index,
  demoId,
  deviceKey,
  onUpdate,
  onRemove,
  canRemove,
}: {
  patient: PatientEntry;
  index: number;
  demoId: string;
  deviceKey: string;
  onUpdate: (p: PatientEntry) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [open, setOpen] = useState(index === 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <User size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium">คนไข้คนที่ {index + 1}</span>
              {patient.beforePhoto && <Badge variant="outline" className="text-[9px] h-4">มีรูป Before</Badge>}
              {patient.afterPhoto && <Badge variant="outline" className="text-[9px] h-4">มีรูป After</Badge>}
            </div>
            <div className="flex items-center gap-1">
              {canRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                >
                  <Trash2 size={12} />
                </Button>
              )}
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t">
            {/* Photos */}
            <div className="flex gap-3 pt-3">
              <PhotoUpload
                label="Before"
                value={patient.beforePhoto}
                onChange={url => onUpdate({ ...patient, beforePhoto: url })}
                demoId={demoId}
                photoType={`${deviceKey}-p${index}-before`}
              />
              <PhotoUpload
                label="After"
                value={patient.afterPhoto}
                onChange={url => onUpdate({ ...patient, afterPhoto: url })}
                demoId={demoId}
                photoType={`${deviceKey}-p${index}-after`}
              />
            </div>

            {/* Parameters */}
            <QuickNoteField
              label="Parameter / บริเวณที่ทำ"
              value={patient.parameters}
              onChange={v => onUpdate({ ...patient, parameters: v })}
              quickNoteKey="parameters"
              placeholder="Energy level, จำนวนช็อต, บริเวณที่ทำ..."
            />

            {/* Pain Score */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pain Score: {patient.painScore}/10</Label>
              <Slider
                value={[patient.painScore]}
                onValueChange={([v]) => onUpdate({ ...patient, painScore: v })}
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>ไม่เจ็บ</span>
                <span>เจ็บมาก</span>
              </div>
            </div>

            {/* Satisfaction */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ความพึงพอใจคนไข้</Label>
              <div className="flex gap-1.5 flex-wrap">
                {SATISFACTION_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onUpdate({ ...patient, satisfaction: opt })}
                    className={cn(
                      "px-2.5 py-1 text-[10px] rounded-full border transition-colors",
                      patient.satisfaction === opt
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Side Effects */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ผลข้างเคียง</Label>
              <div className="flex gap-2 flex-wrap">
                {SIDE_EFFECTS.map(se => (
                  <label key={se} className="flex items-center gap-1 text-[10px]">
                    <Checkbox
                      checked={patient.sideEffects.includes(se)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...patient.sideEffects, se]
                          : patient.sideEffects.filter(s => s !== se);
                        onUpdate({ ...patient, sideEffects: updated });
                      }}
                      className="h-3.5 w-3.5"
                    />
                    {se}
                  </label>
                ))}
              </div>
            </div>

            {/* Feeling */}
            <QuickNoteField
              label="Feeling / ความรู้สึกคนไข้"
              value={patient.feeling}
              onChange={v => onUpdate({ ...patient, feeling: v })}
              quickNoteKey="feeling"
              placeholder="บันทึกความรู้สึกของคนไข้..."
            />

            {/* Presentation notes */}
            <QuickNoteField
              label="บันทึกสิ่งที่นำเสนอ"
              value={patient.presentationNotes}
              onChange={v => onUpdate({ ...patient, presentationNotes: v })}
              quickNoteKey="presentation"
              placeholder="สิ่งที่นำเสนอคนไข้และหมอ..."
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface DemoReportDialogProps {
  demoId: string;
  clinicName: string;
  productsDemoed: string[];
  existingReport: Record<string, DeviceReport> | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}

export default function DemoReportDialog({
  demoId,
  clinicName,
  productsDemoed,
  existingReport,
  open,
  onOpenChange,
  onSaved,
}: DemoReportDialogProps) {
  // Selected devices
  const [selectedDevices, setSelectedDevices] = useState<DeviceKey[]>(() => {
    if (existingReport) return Object.keys(existingReport) as DeviceKey[];
    // Pre-select from products_demo
    const mapped: DeviceKey[] = [];
    productsDemoed.forEach(p => {
      const lower = p.toLowerCase();
      if (lower.includes('doublo')) mapped.push('doublo');
      else if (lower.includes('quattro')) mapped.push('quattro');
      else if (lower.includes('pico')) mapped.push('picohi');
      else if (lower.includes('trica')) mapped.push('trica3d');
    });
    return [...new Set(mapped)];
  });

  const [reports, setReports] = useState<Record<string, DeviceReport>>(() => {
    if (existingReport) return existingReport;
    const init: Record<string, DeviceReport> = {};
    DEVICES.forEach(d => {
      init[d.key] = d.hasPatients
        ? { patients: [createPatient()] }
        : { presentationNotes: '', patients: [] };
    });
    return init;
  });

  const [saving, setSaving] = useState(false);

  const toggleDevice = (key: DeviceKey) => {
    setSelectedDevices(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const updatePatient = (deviceKey: string, patientId: string, updated: PatientEntry) => {
    setReports(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        patients: prev[deviceKey].patients.map(p => p.id === patientId ? updated : p),
      },
    }));
  };

  const addPatient = (deviceKey: string) => {
    setReports(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        patients: [...prev[deviceKey].patients, createPatient()],
      },
    }));
  };

  const removePatient = (deviceKey: string, patientId: string) => {
    setReports(prev => ({
      ...prev,
      [deviceKey]: {
        ...prev[deviceKey],
        patients: prev[deviceKey].patients.filter(p => p.id !== patientId),
      },
    }));
  };

  const handleSave = async () => {
    if (selectedDevices.length === 0) {
      toast.error('กรุณาเลือกเครื่องอย่างน้อย 1 รายการ');
      return;
    }

    setSaving(true);
    // Only save selected devices
    const reportData: Record<string, DeviceReport> = {};
    selectedDevices.forEach(key => {
      reportData[key] = reports[key];
    });

    const { error } = await supabase
      .from('demos')
      .update({
        report_data: reportData as any,
        report_submitted: true,
      })
      .eq('id', demoId);

    if (error) {
      toast.error('บันทึกไม่สำเร็จ');
      console.error(error);
    } else {
      toast.success('บันทึกรายงาน DEMO สำเร็จ');
      onSaved();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            รายงานเคส DEMO — {clinicName}
          </DialogTitle>
        </DialogHeader>

        {/* Device selector */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">เลือกเครื่องที่ Demo (เลือกได้หลายรายการ)</Label>
          <div className="flex flex-wrap gap-2">
            {DEVICES.map(d => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDevice(d.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  selectedDevices.includes(d.key)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted border-border"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Device sections */}
        <div className="space-y-4">
          {selectedDevices.map(deviceKey => {
            const deviceConfig = DEVICES.find(d => d.key === deviceKey)!;
            const deviceReport = reports[deviceKey] || { patients: [createPatient()], presentationNotes: '' };

            return (
              <div key={deviceKey} className="space-y-2 border rounded-lg p-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{deviceConfig.label}</h3>
                  {'heads' in deviceConfig && deviceConfig.heads && (
                    <div className="flex gap-1">
                      {deviceConfig.heads.map(h => (
                        <Badge key={h} variant="outline" className="text-[9px] h-4">{h}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                {deviceConfig.hasPatients ? (
                  <div className="space-y-2">
                    {deviceReport.patients.map((patient, idx) => (
                      <PatientCard
                        key={patient.id}
                        patient={patient}
                        index={idx}
                        demoId={demoId}
                        deviceKey={deviceKey}
                        onUpdate={p => updatePatient(deviceKey, patient.id, p)}
                        onRemove={() => removePatient(deviceKey, patient.id)}
                        canRemove={deviceReport.patients.length > 1}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => addPatient(deviceKey)}
                    >
                      <Plus size={12} />
                      เพิ่มคนไข้
                    </Button>
                  </div>
                ) : (
                  /* Trica3D - presentation notes only */
                  <QuickNoteField
                    label="บันทึกสิ่งที่นำเสนอ"
                    value={deviceReport.presentationNotes || ''}
                    onChange={v => setReports(prev => ({
                      ...prev,
                      [deviceKey]: { ...prev[deviceKey], presentationNotes: v },
                    }))}
                    quickNoteKey="presentation"
                    placeholder="บันทึกสิ่งที่นำเสนอ Trica3D..."
                  />
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกและปิดเคส'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

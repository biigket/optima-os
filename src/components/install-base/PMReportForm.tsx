import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PMReport, PMCheckItem, PMCartridgeEntry, PMResultStatus, Installation } from '@/types/installBase';
import { getChecklistsByCategory, getFirmwareFields, getProductDisplayName, getCartridgeTypes, getSectionTitles } from '@/types/installBase';
import ComboSelect from '@/components/ui/ComboSelect';

// Shared version options that grow as users add new ones
const versionStore: Record<string, string[]> = {
  swVer: ['1.0.0', '1.1.0', '1.2.0', '2.0.0'],
  fwVer: ['1.0.0', '1.1.0', '2.0.0'],
  fwFlLr: ['1.0', '1.1', '2.0'],
  fwSdLr: ['1.0', '1.1', '2.0'],
  fwRm: ['1.0', '1.1', '2.0'],
  fwAmp: ['1.0', '1.1', '2.0'],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installation: Installation;
  maintenanceNumber: number;
  scheduledDate: string;
  existingReport?: PMReport;
  onSave: (report: PMReport) => void;
}

function ChecklistSection({ title, items, onChange }: { title: string; items: PMCheckItem[]; onChange: (items: PMCheckItem[]) => void }) {
  function toggleItem(index: number, value: boolean | null) {
    const updated = [...items];
    updated[index] = { ...updated[index], pass: value };
    onChange(updated);
  }
  function updateRemark(index: number, remark: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], remark };
    onChange(updated);
  }

  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">{title}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">รายการ</TableHead>
            <TableHead className="w-[60px] text-center">Pass</TableHead>
            <TableHead className="w-[60px] text-center">Fail</TableHead>
            <TableHead className="w-[60px] text-center">N/A</TableHead>
            <TableHead>Remark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{item.name}</TableCell>
              <TableCell className="text-center">
                <button onClick={() => toggleItem(i, true)} className={`p-1 rounded ${item.pass === true ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground/40'}`}>
                  <CheckCircle size={18} />
                </button>
              </TableCell>
              <TableCell className="text-center">
                <button onClick={() => toggleItem(i, false)} className={`p-1 rounded ${item.pass === false ? 'text-red-600 bg-red-50' : 'text-muted-foreground/40'}`}>
                  <XCircle size={18} />
                </button>
              </TableCell>
              <TableCell className="text-center">
                <button onClick={() => toggleItem(i, null)} className={`p-1 rounded ${item.pass === null ? 'text-gray-600 bg-gray-100' : 'text-muted-foreground/40'}`}>
                  <MinusCircle size={18} />
                </button>
              </TableCell>
              <TableCell>
                <Input value={item.remark} onChange={e => updateRemark(i, e.target.value)} className="h-8 text-xs" placeholder="S/N หรือหมายเหตุ" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PMReportForm({ open, onOpenChange, installation, maintenanceNumber, scheduledDate, existingReport, onSave }: Props) {
  const category = installation.productCategory;
  const defaultChecklists = getChecklistsByCategory(category);
  const firmwareFields = getFirmwareFields(category);
  const cartridgeTypes = getCartridgeTypes(category);
  const displayName = getProductDisplayName(category);
  const sectionTitles = getSectionTitles(category);

  // Firmware versions as a dynamic map
  const [fwValues, setFwValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    firmwareFields.forEach(f => {
      defaults[f.key] = (existingReport as any)?.[f.key] || '';
    });
    return defaults;
  });

  const [operationChecklist, setOperationChecklist] = useState<PMCheckItem[]>(
    existingReport?.operationChecklist || defaultChecklists.operation
  );
  const [safetyChecklist, setSafetyChecklist] = useState<PMCheckItem[]>(
    existingReport?.safetyChecklist || defaultChecklists.safety
  );
  const [coolingChecklist, setCoolingChecklist] = useState<PMCheckItem[]>(
    existingReport?.coolingChecklist || defaultChecklists.cooling
  );

  const [cartridges, setCartridges] = useState<PMCartridgeEntry[]>(
    existingReport?.cartridges || []
  );

  const [remark, setRemark] = useState(existingReport?.remark || '');
  const [resultStatus, setResultStatus] = useState<PMResultStatus>(existingReport?.resultStatus || 'complete');
  const [resultOther, setResultOther] = useState(existingReport?.resultOther || '');
  const [serviceEngineer, setServiceEngineer] = useState(existingReport?.serviceEngineer || '');
  const [serviceDate, setServiceDate] = useState(existingReport?.serviceDate || new Date().toISOString().split('T')[0]);
  const [serviceTel, setServiceTel] = useState(existingReport?.serviceTel || '');
  const [customerName, setCustomerName] = useState(existingReport?.customerName || '');
  const [customerDate, setCustomerDate] = useState(existingReport?.customerDate || new Date().toISOString().split('T')[0]);
  const [customerTel, setCustomerTel] = useState(existingReport?.customerTel || '');
  const [, forceUpdate] = useState(0);

  function addCartridge() {
    const defaultType = cartridgeTypes?.[0] || '';
    setCartridges([...cartridges, { type: defaultType, serialNumber: '', remainShot: 0, shotTestRemain: 0, shotTestTotal: 5, passFail: true }]);
  }

  function removeCartridge(index: number) {
    setCartridges(cartridges.filter((_, i) => i !== index));
  }

  function updateCartridge(index: number, field: keyof PMCartridgeEntry, value: any) {
    const updated = [...cartridges];
    updated[index] = { ...updated[index], [field]: value };
    setCartridges(updated);
  }

  function handleSave() {
    const report: PMReport = {
      id: existingReport?.id || `pm-${Date.now()}`,
      installationId: installation.id,
      maintenanceNumber,
      scheduledDate,
      actualDate: serviceDate,
      status: 'COMPLETED',
      swVer: fwValues.swVer || '',
      fwVer: fwValues.fwVer || '',
      fwFlLr: fwValues.fwFlLr || '',
      fwSdLr: fwValues.fwSdLr || '',
      fwRm: fwValues.fwRm || '',
      fwAmp: fwValues.fwAmp || '',
      operationChecklist, safetyChecklist, coolingChecklist,
      cartridges, remark, resultStatus, resultOther,
      serviceEngineer, serviceDate, serviceTel,
      customerName, customerDate, customerTel,
    };
    onSave(report);
    onOpenChange(false);
    toast({ title: `บันทึก PM Report ครั้งที่ ${maintenanceNumber} เรียบร้อย` });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>QC : {displayName}</span>
            <Badge variant="outline">Equipment Inspection Report</Badge>
            <Badge variant="secondary">PM ครั้งที่ {maintenanceNumber}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 rounded-md bg-muted/50">
            <div><Label className="text-xs text-muted-foreground">Customer</Label><p className="text-sm font-medium">{installation.clinic}</p></div>
            <div><Label className="text-xs text-muted-foreground">Serial Number</Label><p className="text-sm font-mono font-medium">{installation.serialNumber}</p></div>
            <div><Label className="text-xs text-muted-foreground">กำหนดการ PM</Label><p className="text-sm">{scheduledDate}</p></div>
          </div>

          {/* Firmware versions — dynamic per category */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Firmware / Software Version</h4>
            <div className={`grid gap-2 ${firmwareFields.length <= 2 ? 'grid-cols-2' : 'grid-cols-3 md:grid-cols-6'}`}>
              {firmwareFields.map(({ key, label }) => {
                if (!versionStore[key]) versionStore[key] = ['1.0.0', '1.1.0', '2.0.0'];
                return (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <ComboSelect
                      value={fwValues[key] || ''}
                      onChange={v => setFwValues(prev => ({ ...prev, [key]: v }))}
                      options={versionStore[key]}
                      onAddOption={opt => { if (!versionStore[key].includes(opt)) { versionStore[key] = [...versionStore[key], opt]; forceUpdate(n => n + 1); } }}
                      onRemoveOption={opt => { versionStore[key] = versionStore[key].filter(v => v !== opt); forceUpdate(n => n + 1); }}
                      placeholder="เลือก..."
                      className="h-8 text-xs w-full"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1. Operation System */}
          <ChecklistSection title={sectionTitles.operation} items={operationChecklist} onChange={setOperationChecklist} />

          {/* 2. Safety System */}
          <ChecklistSection title={sectionTitles.safety} items={safetyChecklist} onChange={setSafetyChecklist} />

          {/* 3. Cooling / Analysis System */}
          <ChecklistSection title={sectionTitles.cooling} items={coolingChecklist} onChange={setCoolingChecklist} />

          {/* 4. Cartridge — only for categories that have cartridges */}
          {cartridgeTypes && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">4. Cartridge</h4>
                <Button variant="outline" size="sm" onClick={addCartridge}><Plus size={14} className="mr-1" />เพิ่ม Cartridge</Button>
              </div>
              {cartridges.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Serial No.</TableHead>
                        <TableHead>Remain Shot</TableHead>
                        <TableHead>Shot Test Remain</TableHead>
                        <TableHead>Shot Test Total</TableHead>
                        <TableHead>Pass/Fail</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartridges.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <select className="border rounded px-2 py-1 text-xs bg-background" value={c.type} onChange={e => updateCartridge(i, 'type', e.target.value)}>
                              {cartridgeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </TableCell>
                          <TableCell><Input value={c.serialNumber} onChange={e => updateCartridge(i, 'serialNumber', e.target.value)} className="h-7 text-xs w-36" /></TableCell>
                          <TableCell><Input type="number" value={c.remainShot} onChange={e => updateCartridge(i, 'remainShot', parseInt(e.target.value) || 0)} className="h-7 text-xs w-24" /></TableCell>
                          <TableCell><Input type="number" value={c.shotTestRemain} onChange={e => updateCartridge(i, 'shotTestRemain', parseInt(e.target.value) || 0)} className="h-7 text-xs w-24" /></TableCell>
                          <TableCell><Input type="number" value={c.shotTestTotal} onChange={e => updateCartridge(i, 'shotTestTotal', parseInt(e.target.value) || 0)} className="h-7 text-xs w-20" /></TableCell>
                          <TableCell>
                            <button onClick={() => updateCartridge(i, 'passFail', !c.passFail)} className={`px-2 py-1 rounded text-xs font-medium ${c.passFail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {c.passFail ? 'Pass' : 'Fail'}
                            </button>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => removeCartridge(i)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Note / Remark */}
          <div>
            <Label>Note</Label>
            <Textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} placeholder="เครื่องสามารถใช้งานได้ปกติ" />
          </div>

          {/* Result */}
          <div>
            <Label className="text-sm font-semibold">Result</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {([
                { value: 'complete' as PMResultStatus, label: 'Complete' },
                { value: 'claim' as PMResultStatus, label: 'Claim' },
                { value: 'repair' as PMResultStatus, label: 'Repair' },
                { value: 'other' as PMResultStatus, label: 'Other' },
              ]).map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resultStatus"
                    checked={resultStatus === opt.value}
                    onChange={() => setResultStatus(opt.value)}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
            {resultStatus === 'other' && (
              <Input value={resultOther} onChange={e => setResultOther(e.target.value)} className="mt-2 h-8" placeholder="ระบุรายละเอียด..." />
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-md border space-y-2">
              <h4 className="font-semibold text-sm">Service Engineer</h4>
              <div><Label className="text-xs">ชื่อ</Label><Input value={serviceEngineer} onChange={e => setServiceEngineer(e.target.value)} className="h-8" /></div>
              <div><Label className="text-xs">วันที่</Label><Input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)} className="h-8" /></div>
              <div><Label className="text-xs">โทร</Label><Input value={serviceTel} onChange={e => setServiceTel(e.target.value)} className="h-8" /></div>
            </div>
            <div className="p-3 rounded-md border space-y-2">
              <h4 className="font-semibold text-sm">Customer</h4>
              <div><Label className="text-xs">ชื่อ</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-8" /></div>
              <div><Label className="text-xs">วันที่</Label><Input type="date" value={customerDate} onChange={e => setCustomerDate(e.target.value)} className="h-8" /></div>
              <div><Label className="text-xs">โทร</Label><Input value={customerTel} onChange={e => setCustomerTel(e.target.value)} className="h-8" /></div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก PM Report</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

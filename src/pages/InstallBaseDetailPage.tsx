import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle, Eye, Plus, Trash2,
  Pencil, Save, X, RefreshCw, ArrowRightLeft, Undo2,
} from 'lucide-react';
import {
  mockInstallations, generatePMSchedule,
  type PMReport, type Installation, type ReplacementRecord, type ReplacementType,
} from '@/data/installBaseMockData';
import PMReportForm from '@/components/install-base/PMReportForm';
import PMReportViewDialog from '@/components/install-base/PMReportViewDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';

export default function InstallBaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState(() => {
    const found = mockInstallations.find(i => i.id === id);
    return found ? { ...found } : null;
  });
  const [pmCount, setPmCount] = useState(2);
  const [deletedPMs, setDeletedPMs] = useState<number[]>([]);
  const [pmToDelete, setPmToDelete] = useState<number | null>(null);
  const [pmFormOpen, setPmFormOpen] = useState(false);
  const [pmViewOpen, setPmViewOpen] = useState(false);
  const [selectedPmNumber, setSelectedPmNumber] = useState(1);
  const [selectedPmDate, setSelectedPmDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<PMReport | undefined>();

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    serialNumber: '',
    installDate: '',
    warrantyDays: '',
    warrantyExpiry: '',
    province: '',
    region: '',
    notes: '',
  });

  // Replacement dialog
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [replaceType, setReplaceType] = useState<'SWAP' | 'LOANER'>('SWAP');
  const [replaceNewSN, setReplaceNewSN] = useState('');
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceNote, setReplaceNote] = useState('');

  if (!inst) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">ไม่พบข้อมูลการติดตั้ง</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/install-base')}>กลับ</Button>
      </div>
    );
  }

  const hasLoaner = !!inst.loanerSerialNumber;
  const pmSchedule = generatePMSchedule(inst.installDate, pmCount).filter(pm => !deletedPMs.includes(pm.number));
  const today = new Date().toISOString().split('T')[0];
  const warrantyExpired = inst.warrantyExpiry < today;

  function syncToMock(updated: Installation) {
    const idx = mockInstallations.findIndex(i => i.id === updated.id);
    if (idx !== -1) mockInstallations[idx] = { ...updated };
    setInst({ ...updated });
  }

  // === EDIT ===
  function startEdit() {
    setEditForm({
      serialNumber: inst!.serialNumber,
      installDate: inst!.installDate,
      warrantyDays: String(inst!.warrantyDays),
      warrantyExpiry: inst!.warrantyExpiry,
      province: inst!.province,
      region: inst!.region,
      notes: inst!.notes,
    });
    setEditing(true);
  }

  function saveEdit() {
    const wDays = parseInt(editForm.warrantyDays) || inst!.warrantyDays;
    const expiry = new Date(editForm.installDate);
    expiry.setDate(expiry.getDate() + wDays);

    const updated: Installation = {
      ...inst!,
      serialNumber: editForm.serialNumber,
      installDate: editForm.installDate,
      warrantyDays: wDays,
      warrantyExpiry: editForm.warrantyExpiry || expiry.toISOString().split('T')[0],
      province: editForm.province,
      region: editForm.region,
      notes: editForm.notes,
    };
    syncToMock(updated);
    setEditing(false);
    toast({ title: 'บันทึกการแก้ไขแล้ว' });
  }

  // === REPLACEMENT ===
  function openReplaceDialog(type: 'SWAP' | 'LOANER') {
    setReplaceType(type);
    setReplaceNewSN('');
    setReplaceReason('');
    setReplaceNote('');
    setReplaceDialogOpen(true);
  }

  function handleReplace() {
    if (!replaceNewSN.trim()) return;

    const record: ReplacementRecord = {
      id: `rep-${Date.now()}`,
      type: replaceType,
      date: new Date().toISOString().split('T')[0],
      oldSerialNumber: inst!.serialNumber,
      newSerialNumber: replaceNewSN.trim(),
      reason: replaceReason,
      note: replaceNote,
      createdBy: 'Tanaka Yuki',
      createdAt: new Date().toISOString(),
    };

    let updated: Installation;
    if (replaceType === 'SWAP') {
      // Permanent swap: replace S/N entirely
      updated = {
        ...inst!,
        serialNumber: replaceNewSN.trim(),
        replacementHistory: [...(inst!.replacementHistory || []), record],
      };
      toast({ title: 'เปลี่ยนเครื่องถาวรแล้ว', description: `${record.oldSerialNumber} → ${record.newSerialNumber}` });
    } else {
      // Loaner: keep original, mark loaner active
      updated = {
        ...inst!,
        originalSerialNumber: inst!.serialNumber,
        loanerSerialNumber: replaceNewSN.trim(),
        serialNumber: replaceNewSN.trim(),
        replacementHistory: [...(inst!.replacementHistory || []), record],
      };
      toast({ title: 'ให้เครื่องยืมแล้ว', description: `เครื่องยืม: ${replaceNewSN.trim()}` });
    }

    syncToMock(updated);
    setReplaceDialogOpen(false);
  }

  function handleReturnLoaner() {
    if (!inst!.originalSerialNumber) return;

    const record: ReplacementRecord = {
      id: `rep-${Date.now()}`,
      type: 'LOANER_RETURN',
      date: new Date().toISOString().split('T')[0],
      oldSerialNumber: inst!.loanerSerialNumber || '',
      newSerialNumber: inst!.originalSerialNumber,
      reason: 'คืนเครื่องยืม',
      note: 'ซ่อมเสร็จ คืนเครื่องเดิม',
      createdBy: 'Tanaka Yuki',
      createdAt: new Date().toISOString(),
    };

    const updated: Installation = {
      ...inst!,
      serialNumber: inst!.originalSerialNumber,
      loanerSerialNumber: undefined,
      originalSerialNumber: undefined,
      replacementHistory: [...(inst!.replacementHistory || []), record],
    };

    syncToMock(updated);
    toast({ title: 'คืนเครื่องยืมแล้ว', description: `กลับไปใช้เครื่องเดิม: ${updated.serialNumber}` });
  }

  // === PM ===
  function getReportForPM(pmNumber: number) {
    return inst!.pmReports.find(r => r.maintenanceNumber === pmNumber);
  }

  function handleOpenPMForm(pmNumber: number, scheduledDate: string) {
    setSelectedPmNumber(pmNumber);
    setSelectedPmDate(scheduledDate);
    setSelectedReport(getReportForPM(pmNumber));
    setPmFormOpen(true);
  }

  function handleViewReport(report: PMReport) {
    setSelectedReport(report);
    setPmViewOpen(true);
  }

  function handleSavePM(report: PMReport) {
    const existing = inst!.pmReports.findIndex(r => r.maintenanceNumber === report.maintenanceNumber);
    if (existing >= 0) {
      inst!.pmReports[existing] = report;
    } else {
      inst!.pmReports.push(report);
    }
    syncToMock({ ...inst!, pmReports: [...inst!.pmReports] });
  }

  function handleDeletePM(pmNumber: number) {
    setDeletedPMs(prev => [...prev, pmNumber]);
    const existingIndex = inst!.pmReports.findIndex(r => r.maintenanceNumber === pmNumber);
    if (existingIndex >= 0) {
      inst!.pmReports.splice(existingIndex, 1);
      syncToMock({ ...inst!, pmReports: [...inst!.pmReports] });
    }
    setPmToDelete(null);
  }

  const categoryColors: Record<string, string> = {
    'ND2': 'bg-indigo-100 text-indigo-800',
    'Trica 3D': 'bg-violet-100 text-violet-800',
    'Quattro': 'bg-teal-100 text-teal-800',
    'Picohi': 'bg-pink-100 text-pink-800',
    'Freezero': 'bg-cyan-100 text-cyan-800',
  };

  const replacementTypeLabels: Record<string, { label: string; color: string }> = {
    SWAP: { label: 'เปลี่ยนถาวร', color: 'bg-destructive/10 text-destructive' },
    LOANER: { label: 'เครื่องยืม', color: 'bg-amber-100 text-amber-800' },
    LOANER_RETURN: { label: 'คืนเครื่องยืม', color: 'bg-emerald-100 text-emerald-800' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/install-base')}><ArrowLeft size={18} /></Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Badge className={categoryColors[inst.productCategory]}>{inst.productCategory}</Badge>
            {inst.serialNumber}
            {hasLoaner && (
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">เครื่องยืม</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">{inst.clinic}</p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button size="sm" variant="outline" onClick={startEdit} className="gap-1">
              <Pencil size={14} /> แก้ไข
            </Button>
          )}
        </div>
      </div>

      {/* Loaner banner */}
      {hasLoaner && inst.originalSerialNumber && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800">⚠️ กำลังใช้เครื่องยืมอยู่</p>
              <p className="text-xs text-amber-700">
                เครื่องเดิม: <span className="font-mono font-medium">{inst.originalSerialNumber}</span>
                {' → '}เครื่องยืม: <span className="font-mono font-medium">{inst.loanerSerialNumber}</span>
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleReturnLoaner} className="gap-1 border-amber-400 text-amber-800 hover:bg-amber-100">
              <Undo2 size={14} /> คืนเครื่องยืม
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ข้อมูลการติดตั้ง</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {editing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">S/N</Label>
                  <Input value={editForm.serialNumber} onChange={e => setEditForm(f => ({ ...f, serialNumber: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">วันติดตั้ง</Label>
                  <Input type="date" value={editForm.installDate} onChange={e => setEditForm(f => ({ ...f, installDate: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">จังหวัด</Label>
                  <Input value={editForm.province} onChange={e => setEditForm(f => ({ ...f, province: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ภูมิภาค</Label>
                  <Input value={editForm.region} onChange={e => setEditForm(f => ({ ...f, region: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">หมายเหตุ</Label>
                  <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                </div>
              </>
            ) : (
              <>
                <p><span className="text-muted-foreground">วันติดตั้ง:</span> {inst.installDate}</p>
                <p><span className="text-muted-foreground">จังหวัด:</span> {inst.province || '-'}</p>
                <p><span className="text-muted-foreground">ภูมิภาค:</span> {inst.region || '-'}</p>
                {inst.notes && <p><span className="text-muted-foreground">หมายเหตุ:</span> {inst.notes}</p>}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ประกัน</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {editing ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">ระยะประกัน (วัน)</Label>
                  <Input type="number" value={editForm.warrantyDays} onChange={e => setEditForm(f => ({ ...f, warrantyDays: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">วันหมดประกัน</Label>
                  <Input type="date" value={editForm.warrantyExpiry} onChange={e => setEditForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
                </div>
              </>
            ) : (
              <>
                <p><span className="text-muted-foreground">ระยะประกัน:</span> {inst.warrantyDays} วัน</p>
                <p>
                  <span className="text-muted-foreground">หมดประกัน:</span>{' '}
                  <span className={warrantyExpired ? 'text-destructive font-medium' : 'text-emerald-600 font-medium'}>
                    {inst.warrantyExpiry} {warrantyExpired ? '(หมดแล้ว)' : '(ยังไม่หมด)'}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">เครื่องทดแทน</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!editing && (
              <>
                <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => openReplaceDialog('SWAP')}>
                  <ArrowRightLeft size={14} /> เปลี่ยนเครื่องถาวร (Swap)
                </Button>
                {!hasLoaner && (
                  <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => openReplaceDialog('LOANER')}>
                    <RefreshCw size={14} /> ให้เครื่องยืมชั่วคราว (Loaner)
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">ประวัติเปลี่ยน: {(inst.replacementHistory || []).length} ครั้ง</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="gap-1">
            <X size={14} /> ยกเลิก
          </Button>
          <Button size="sm" onClick={saveEdit} className="gap-1">
            <Save size={14} /> บันทึก
          </Button>
        </div>
      )}

      {/* Replacement History */}
      {(inst.replacementHistory || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft size={16} /> ประวัติการเปลี่ยนเครื่อง</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">วันที่</TableHead>
                  <TableHead className="text-xs">ประเภท</TableHead>
                  <TableHead className="text-xs">S/N เดิม</TableHead>
                  <TableHead className="text-xs">S/N ใหม่</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">เหตุผล</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">โดย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(inst.replacementHistory || []).map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{r.date}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${replacementTypeLabels[r.type]?.color}`} variant="secondary">
                        {replacementTypeLabels[r.type]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.oldSerialNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{r.newSerialNumber}</TableCell>
                    <TableCell className="text-xs hidden sm:table-cell">{r.reason || '-'}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{r.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* PM Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">ตาราง Preventive Maintenance (ทุก 6 เดือน)</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setPmCount(prev => prev + 2)}>
            <Plus size={14} className="mr-1" />เพิ่ม PM (+2 ครั้ง)
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ครั้งที่</TableHead>
                <TableHead>กำหนดวัน PM</TableHead>
                <TableHead>วันที่ทำจริง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pmSchedule.map(pm => {
                const report = getReportForPM(pm.number);
                const isOverdue = !report && pm.date < today;
                const isPending = !report && pm.date >= today;
                return (
                  <TableRow key={pm.number} className={isOverdue ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">PM {pm.number}</TableCell>
                    <TableCell>{pm.date}</TableCell>
                    <TableCell>{report?.actualDate || '-'}</TableCell>
                    <TableCell>
                      {report ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle size={12} className="mr-1" />เสร็จแล้ว
                        </Badge>
                      ) : isOverdue ? (
                        <Badge className="bg-destructive/10 text-destructive">
                          <AlertTriangle size={12} className="mr-1" />เกินกำหนด
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <Clock size={12} className="mr-1" />รอดำเนินการ
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {report && (
                          <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                            <Eye size={14} className="mr-1" />ดู Report
                          </Button>
                        )}
                        {inst.productCategory === 'ND2' && (
                          <Button variant={report ? 'outline' : 'default'} size="sm" onClick={() => handleOpenPMForm(pm.number, pm.date)}>
                            <FileText size={14} className="mr-1" />{report ? 'แก้ไข' : 'กรอก PM Report'}
                          </Button>
                        )}
                        {isPending && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setPmToDelete(pm.number)}>
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PM Report Form & View */}
      {inst.productCategory === 'ND2' && (
        <PMReportForm
          open={pmFormOpen}
          onOpenChange={setPmFormOpen}
          installation={inst}
          maintenanceNumber={selectedPmNumber}
          scheduledDate={selectedPmDate}
          existingReport={selectedReport}
          onSave={handleSavePM}
        />
      )}
      <PMReportViewDialog open={pmViewOpen} onOpenChange={setPmViewOpen} report={selectedReport} installation={inst} />

      {/* Delete PM Confirmation */}
      <AlertDialog open={pmToDelete !== null} onOpenChange={() => setPmToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ PM</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ PM ครั้งที่ {pmToDelete} ที่ยังรอดำเนินการใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => pmToDelete && handleDeletePM(pmToDelete)}>ลบ PM</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replacement Dialog */}
      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {replaceType === 'SWAP' ? <ArrowRightLeft size={18} /> : <RefreshCw size={18} />}
              {replaceType === 'SWAP' ? 'เปลี่ยนเครื่องถาวร (Swap)' : 'ให้เครื่องยืมชั่วคราว (Loaner)'}
            </DialogTitle>
            <DialogDescription>
              {replaceType === 'SWAP'
                ? 'เปลี่ยนเครื่องถาวร — S/N เดิมจะถูกบันทึกไว้ในประวัติ'
                : 'ให้เครื่องยืมระหว่างนำเครื่องเดิมไปซ่อม — สามารถคืนเครื่องยืมได้ภายหลัง'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <p><span className="text-muted-foreground">เครื่องปัจจุบัน:</span> <span className="font-mono font-medium">{inst.serialNumber}</span></p>
            </div>

            <div className="space-y-2">
              <Label>S/N เครื่องใหม่ *</Label>
              <Input
                placeholder="กรอก Serial Number เครื่องใหม่..."
                value={replaceNewSN}
                onChange={e => setReplaceNewSN(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>เหตุผล</Label>
              <Select value={replaceReason} onValueChange={setReplaceReason}>
                <SelectTrigger><SelectValue placeholder="เลือกเหตุผล..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="เครื่องเสีย/ชำรุด">เครื่องเสีย/ชำรุด</SelectItem>
                  <SelectItem value="อัปเกรดเครื่อง">อัปเกรดเครื่อง</SelectItem>
                  <SelectItem value="เครื่องส่งซ่อมตปท.">เครื่องส่งซ่อมตปท.</SelectItem>
                  <SelectItem value="ลูกค้าร้องขอ">ลูกค้าร้องขอ</SelectItem>
                  <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>หมายเหตุเพิ่มเติม</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม..."
                value={replaceNote}
                onChange={e => setReplaceNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleReplace} disabled={!replaceNewSN.trim()}>
              {replaceType === 'SWAP' ? 'เปลี่ยนเครื่อง' : 'ให้เครื่องยืม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

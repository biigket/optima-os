import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertTriangle, Eye, Plus, Trash2 } from 'lucide-react';
import { mockInstallations, generatePMSchedule, type PMReport } from '@/data/installBaseMockData';
import PMReportForm from '@/components/install-base/PMReportForm';
import PMReportViewDialog from '@/components/install-base/PMReportViewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InstallBaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inst, setInst] = useState(() => mockInstallations.find(i => i.id === id));
  const [pmCount, setPmCount] = useState(2);
  const [deletedPMs, setDeletedPMs] = useState<number[]>([]);
  const [pmToDelete, setPmToDelete] = useState<number | null>(null);
  const [pmFormOpen, setPmFormOpen] = useState(false);
  const [pmViewOpen, setPmViewOpen] = useState(false);
  const [selectedPmNumber, setSelectedPmNumber] = useState(1);
  const [selectedPmDate, setSelectedPmDate] = useState('');
  const [selectedReport, setSelectedReport] = useState<PMReport | undefined>();

  if (!inst) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">ไม่พบข้อมูลการติดตั้ง</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/install-base')}>กลับ</Button>
      </div>
    );
  }

  const pmSchedule = generatePMSchedule(inst.installDate, pmCount);
  const today = new Date().toISOString().split('T')[0];
  const warrantyExpired = inst.warrantyExpiry < today;

  function getReportForPM(pmNumber: number) {
    return inst!.pmReports.find(r => r.maintenanceNumber === pmNumber);
  }

  function handleOpenPMForm(pmNumber: number, scheduledDate: string) {
    const existing = getReportForPM(pmNumber);
    setSelectedPmNumber(pmNumber);
    setSelectedPmDate(scheduledDate);
    setSelectedReport(existing);
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
    // Also update the shared mock
    const sharedInst = mockInstallations.find(i => i.id === inst!.id);
    if (sharedInst) sharedInst.pmReports = [...inst!.pmReports];
    setInst({ ...inst! });
  }

  const categoryColors: Record<string, string> = {
    'ND2': 'bg-indigo-100 text-indigo-800',
    'Trica 3D': 'bg-violet-100 text-violet-800',
    'Quattro': 'bg-teal-100 text-teal-800',
    'Picohi': 'bg-pink-100 text-pink-800',
    'Freezero': 'bg-cyan-100 text-cyan-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/install-base')}><ArrowLeft size={18} /></Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Badge className={categoryColors[inst.productCategory]}>{inst.productCategory}</Badge>
            {inst.serialNumber}
          </h1>
          <p className="text-sm text-muted-foreground">{inst.clinic}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ข้อมูลการติดตั้ง</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">วันติดตั้ง:</span> {inst.installDate}</p>
            <p><span className="text-muted-foreground">จังหวัด:</span> {inst.province || '-'}</p>
            <p><span className="text-muted-foreground">ภูมิภาค:</span> {inst.region || '-'}</p>
            {inst.notes && <p><span className="text-muted-foreground">หมายเหตุ:</span> {inst.notes}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ประกัน</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">ระยะประกัน:</span> {inst.warrantyDays} วัน</p>
            <p>
              <span className="text-muted-foreground">หมดประกัน:</span>{' '}
              <span className={warrantyExpired ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'}>
                {inst.warrantyExpiry} {warrantyExpired ? '(หมดแล้ว)' : '(ยังไม่หมด)'}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">สรุป PM</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">ทำ PM แล้ว:</span> {inst.pmReports.filter(r => r.status === 'COMPLETED').length} / {pmSchedule.length} ครั้ง</p>
            <p><span className="text-muted-foreground">PM ถัดไป:</span> {pmSchedule.find(s => !getReportForPM(s.number))?.date || 'ครบแล้ว'}</p>
          </CardContent>
        </Card>
      </div>

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
                  <TableRow key={pm.number} className={isOverdue ? 'bg-red-50/50' : ''}>
                    <TableCell className="font-medium">PM {pm.number}</TableCell>
                    <TableCell>{pm.date}</TableCell>
                    <TableCell>{report?.actualDate || '-'}</TableCell>
                    <TableCell>
                      {report ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          <CheckCircle size={12} className="mr-1" />เสร็จแล้ว
                        </Badge>
                      ) : isOverdue ? (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
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
                          <Button
                            variant={report ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleOpenPMForm(pm.number, pm.date)}
                          >
                            <FileText size={14} className="mr-1" />{report ? 'แก้ไข' : 'กรอก PM Report'}
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

      <PMReportViewDialog
        open={pmViewOpen}
        onOpenChange={setPmViewOpen}
        report={selectedReport}
        installation={inst}
      />
    </div>
  );
}

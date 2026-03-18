import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { PMReport, Installation } from '@/types/installBase';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: PMReport;
  installation?: Installation;
}

function PassIcon({ pass }: { pass: boolean | null }) {
  if (pass === true) return <CheckCircle size={16} className="text-emerald-600" />;
  if (pass === false) return <XCircle size={16} className="text-red-600" />;
  return <MinusCircle size={16} className="text-gray-400" />;
}

function ChecklistView({ title, items }: { title: string; items: { name: string; pass: boolean | null; remark: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <Table>
        <TableHeader><TableRow><TableHead>รายการ</TableHead><TableHead className="w-16 text-center">ผล</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm">{item.name}</TableCell>
              <TableCell className="text-center"><PassIcon pass={item.pass} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.remark || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function PMReportViewDialog({ open, onOpenChange, report, installation }: Props) {
  if (!report || !installation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            PM Report ครั้งที่ {report.maintenanceNumber}
            <Badge className="bg-emerald-100 text-emerald-800">เสร็จแล้ว</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/50 rounded-md text-sm">
            <div><span className="text-muted-foreground">Customer:</span> {installation.clinic}</div>
            <div><span className="text-muted-foreground">S/N:</span> <span className="font-mono">{installation.serialNumber}</span></div>
            <div><span className="text-muted-foreground">วันที่ทำ:</span> {report.actualDate}</div>
          </div>

          {(report.swVer || report.fwVer) && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {[['SW', report.swVer], ['FW', report.fwVer], ['FW FL-LR', report.fwFlLr], ['FW SD-LR', report.fwSdLr], ['FW RM', report.fwRm], ['FW AMP', report.fwAmp]].map(([label, val]) => (
                <div key={label as string} className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">{label}:</span> <span className="font-mono">{val || '-'}</span>
                </div>
              ))}
            </div>
          )}

          <ChecklistView title="1. Operation System and Handpiece" items={report.operationChecklist} />
          <ChecklistView title="2. Safety System" items={report.safetyChecklist} />
          <ChecklistView title="3. Cooling System" items={report.coolingChecklist} />

          {report.cartridges.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">4. Cartridge</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead><TableHead>S/N</TableHead><TableHead>Remain</TableHead>
                    <TableHead>Test Remain</TableHead><TableHead>Total</TableHead><TableHead>ผล</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.cartridges.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.type}</TableCell>
                      <TableCell className="font-mono text-xs">{c.serialNumber}</TableCell>
                      <TableCell>{c.remainShot.toLocaleString()}</TableCell>
                      <TableCell>{c.shotTestRemain.toLocaleString()}</TableCell>
                      <TableCell>{c.shotTestTotal}</TableCell>
                      <TableCell><Badge className={c.passFail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>{c.passFail ? 'Pass' : 'Fail'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {report.remark && (
            <div className="p-3 bg-muted/30 rounded-md">
              <h4 className="font-semibold text-sm mb-1">Remark</h4>
              <p className="text-sm">{report.remark}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 border rounded-md">
              <h4 className="font-semibold text-sm mb-1">Service Engineer</h4>
              <p>{report.serviceEngineer}</p>
              <p className="text-muted-foreground">{report.serviceDate} | {report.serviceTel}</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-semibold text-sm mb-1">Customer</h4>
              <p>{report.customerName}</p>
              <p className="text-muted-foreground">{report.customerDate} | {report.customerTel}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

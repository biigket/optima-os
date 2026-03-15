import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Wrench, Building2, Cpu, Calendar, User, Clock, Send,
  CheckCircle, AlertTriangle, Camera, ImagePlus,
} from 'lucide-react';
import {
  mockServiceTickets, type ServiceTicket, type ServiceTicketUpdate, type TicketStatus,
  ticketStatusLabels, ticketStatusColors,
  ticketPriorityLabels, ticketPriorityColors,
} from '@/data/serviceTicketMockData';
import { toast } from '@/hooks/use-toast';

export default function ServiceTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const ticketRef = mockServiceTickets.find(t => t.id === id);
  const [ticket, setTicket] = useState<ServiceTicket | null>(ticketRef ? { ...ticketRef } : null);

  // Update form
  const [updateMessage, setUpdateMessage] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');
  const [resolution, setResolution] = useState(ticket?.resolution || '');

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">ไม่พบใบแจ้งซ่อม</p>
        <Button variant="link" onClick={() => navigate('/maintenance')}>กลับไปรายการ</Button>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  function handleAddUpdate() {
    if (!updateMessage.trim()) return;

    const update: ServiceTicketUpdate = {
      id: `stu-${Date.now()}`,
      ticketId: ticket!.id,
      message: updateMessage.trim(),
      photos: [],
      updatedBy: 'Tanaka Yuki',
      newStatus: newStatus || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedTicket = {
      ...ticket!,
      updates: [...ticket!.updates, update],
      updatedAt: new Date().toISOString(),
      ...(newStatus ? { status: newStatus } : {}),
      ...(newStatus === 'CLOSED' || newStatus === 'RESOLVED' ? { closedAt: new Date().toISOString() } : {}),
    };

    // Sync back to mock array
    const idx = mockServiceTickets.findIndex(t => t.id === ticket!.id);
    if (idx !== -1) mockServiceTickets[idx] = updatedTicket;

    setTicket(updatedTicket);
    setUpdateMessage('');
    setNewStatus('');
    toast({ title: 'อัพเดทเรียบร้อย' });
  }

  function handleSaveResolution() {
    const updatedTicket = { ...ticket!, resolution };
    const idx = mockServiceTickets.findIndex(t => t.id === ticket!.id);
    if (idx !== -1) mockServiceTickets[idx] = updatedTicket;
    setTicket(updatedTicket);
    toast({ title: 'บันทึกการแก้ไขแล้ว' });
  }

  function handleCloseTicket() {
    const update: ServiceTicketUpdate = {
      id: `stu-${Date.now()}`,
      ticketId: ticket!.id,
      message: 'ปิด Ticket - งานเสร็จสมบูรณ์',
      photos: [],
      updatedBy: 'Tanaka Yuki',
      newStatus: 'CLOSED',
      createdAt: new Date().toISOString(),
    };

    const updatedTicket = {
      ...ticket!,
      status: 'CLOSED' as TicketStatus,
      closedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updates: [...ticket!.updates, update],
    };

    const idx = mockServiceTickets.findIndex(t => t.id === ticket!.id);
    if (idx !== -1) mockServiceTickets[idx] = updatedTicket;
    setTicket(updatedTicket);
    toast({ title: 'ปิด Ticket เรียบร้อย' });
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/maintenance')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{ticket.ticketNumber}</h1>
            <Badge className={`gap-1 ${ticketStatusColors[ticket.status]}`} variant="secondary">
              {ticketStatusLabels[ticket.status]}
            </Badge>
            <Badge className={`${ticketPriorityColors[ticket.priority]}`} variant="secondary">
              {ticketPriorityLabels[ticket.priority]}
            </Badge>
          </div>
        </div>
        {!isClosed && (
          <Button size="sm" variant="destructive" onClick={handleCloseTicket} className="gap-1">
            <CheckCircle size={14} /> ปิด Ticket
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Updates */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ticket Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Wrench size={15} /> ข้อมูล Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">คลินิก</p>
                    <p className="font-medium">{ticket.clinic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">อุปกรณ์</p>
                    <p className="font-medium">{ticket.itemName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-mono">S/N</span>
                  <p className="font-mono text-sm">{ticket.serialNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">ผู้รับผิดชอบ</p>
                    <p className="font-medium">{ticket.assignedTo}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-1">อาการที่แจ้ง</p>
                <p className="text-sm bg-muted/50 rounded-md p-3">{ticket.symptom}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Clock size={15} /> ประวัติการอัพเดท</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.updates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีการอัพเดท</p>
              )}
              <div className="space-y-4">
                {ticket.updates.map((u, i) => (
                  <div key={u.id} className="relative pl-6 pb-4 last:pb-0">
                    {/* Timeline line */}
                    {i < ticket.updates.length - 1 && (
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border-2 border-primary bg-background flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{u.updatedBy}</span>
                        <span>•</span>
                        <span>{new Date(u.createdAt).toLocaleString('th-TH')}</span>
                        {u.newStatus && (
                          <Badge className={`text-[10px] ${ticketStatusColors[u.newStatus]}`} variant="secondary">
                            → {ticketStatusLabels[u.newStatus]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{u.message}</p>
                      {u.photos.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {u.photos.map((p, j) => (
                            <div key={j} className="h-16 w-16 rounded-md bg-muted border flex items-center justify-center">
                              <Camera size={16} className="text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Update Form */}
          {!isClosed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Send size={15} /> เพิ่มอัพเดท</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="บันทึกความคืบหน้า..."
                  value={updateMessage}
                  onChange={e => setUpdateMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">เปลี่ยนสถานะ (ถ้ามี)</Label>
                    <Select value={newStatus} onValueChange={v => setNewStatus(v as TicketStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="ไม่เปลี่ยน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
                        <SelectItem value="WAITING_PART">รออะไหล่</SelectItem>
                        <SelectItem value="RESOLVED">แก้ไขแล้ว</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" onClick={handleAddUpdate} disabled={!updateMessage.trim()} className="gap-1">
                    <Send size={14} /> ส่ง
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">สรุป</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันที่เปิด</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">อัพเดทล่าสุด</span>
                <span>{new Date(ticket.updatedAt).toLocaleDateString('th-TH')}</span>
              </div>
              {ticket.closedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วันที่ปิด</span>
                  <span>{new Date(ticket.closedAt).toLocaleDateString('th-TH')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ประเภท</span>
                <span>{ticket.itemType === 'DEVICE' ? 'เครื่อง' : 'วัสดุสิ้นเปลือง'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">จำนวนอัพเดท</span>
                <span>{ticket.updates.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Resolution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Wrench size={14} /> การแก้ไข</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="บันทึกสาเหตุและวิธีแก้ไข..."
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                rows={4}
                disabled={isClosed}
              />
              {!isClosed && (
                <Button size="sm" variant="outline" onClick={handleSaveResolution} className="w-full">
                  บันทึกการแก้ไข
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

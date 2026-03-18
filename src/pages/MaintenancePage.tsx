import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Wrench, Search, Plus, AlertTriangle, Clock, CheckCircle, PauseCircle,
  Building2, Calendar,
} from 'lucide-react';
import {
  type ServiceTicket,
  ticketStatusLabels, ticketStatusColors,
  ticketPriorityLabels, ticketPriorityColors,
  type TicketStatus,
} from '@/types/service';
import { supabase } from '@/integrations/supabase/client';
import CreateTicketWizard from '@/components/maintenance/CreateTicketWizard';

const statusIcons: Record<TicketStatus, React.ReactNode> = {
  OPEN: <AlertTriangle size={14} />,
  IN_PROGRESS: <Clock size={14} />,
  WAITING_PART: <PauseCircle size={14} />,
  RESOLVED: <CheckCircle size={14} />,
  CLOSED: <CheckCircle size={14} />,
};

function mapTicketRow(row: any, updates: any[]): ServiceTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number || '',
    accountId: row.account_id || '',
    clinic: row.clinic || '',
    itemType: row.item_type || 'DEVICE',
    itemId: row.item_id || '',
    itemName: row.item_name || '',
    serialNumber: row.serial_number || '',
    symptom: row.symptom || '',
    symptomPhotos: row.symptom_photos || [],
    status: (row.status || 'OPEN') as TicketStatus,
    priority: row.priority || 'NORMAL',
    assignedTo: row.assigned_to || '',
    resolution: row.resolution || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    closedAt: row.closed_at || undefined,
    updates: updates
      .filter(u => u.ticket_id === row.id)
      .map(u => ({
        id: u.id,
        ticketId: u.ticket_id,
        message: u.message || '',
        photos: u.photos || [],
        updatedBy: u.updated_by || '',
        newStatus: u.new_status || undefined,
        createdAt: u.created_at || '',
      })),
  };
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    async function fetchTickets() {
      const [{ data: ticketRows }, { data: updateRows }] = await Promise.all([
        supabase.from('service_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('service_ticket_updates').select('*').order('created_at', { ascending: true }),
      ]);
      if (ticketRows) {
        setTickets(ticketRows.map(r => mapTicketRow(r, updateRows || [])));
      }
    }
    fetchTickets();
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = !search ||
        t.clinic.toLowerCase().includes(search.toLowerCase()) ||
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.itemName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tickets, search, statusFilter]);

  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WAITING_PART').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const urgentCount = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

  const kpis = [
    { label: 'เปิดอยู่', value: openCount, icon: <AlertTriangle size={20} />, color: 'text-blue-600 bg-blue-50' },
    { label: 'กำลังดำเนินการ', value: inProgressCount, icon: <Clock size={20} />, color: 'text-amber-600 bg-amber-50' },
    { label: 'แก้ไขแล้ว/ปิด', value: resolvedCount, icon: <CheckCircle size={20} />, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'ด่วน/สูง', value: urgentCount, icon: <AlertTriangle size={20} />, color: 'text-destructive bg-destructive/10' },
  ];

  const handleTicketCreated = (ticket: ServiceTicket) => {
    setTickets(prev => [ticket, ...prev]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ซ่อมบำรุง</h1>
          <p className="text-sm text-muted-foreground">จัดการใบแจ้งซ่อมทั้งหมด {tickets.length} รายการ</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowWizard(true)}>
          <Plus size={14} /> เปิดใบแจ้งซ่อม
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${k.color}`}>{k.icon}</div>
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
          <Input placeholder="ค้นหา Ticket, คลินิก, S/N..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="สถานะ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
            <SelectItem value="OPEN">เปิด</SelectItem>
            <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
            <SelectItem value="WAITING_PART">รออะไหล่</SelectItem>
            <SelectItem value="RESOLVED">แก้ไขแล้ว</SelectItem>
            <SelectItem value="CLOSED">ปิด</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>คลินิก</TableHead>
                <TableHead className="hidden md:table-cell">อุปกรณ์</TableHead>
                <TableHead className="hidden md:table-cell">S/N</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="hidden sm:table-cell">ความเร่งด่วน</TableHead>
                <TableHead className="hidden lg:table-cell">วันที่เปิด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบ Ticket</TableCell>
                </TableRow>
              )}
              {filtered.map(t => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate(`/maintenance/${t.id}`)}>
                  <TableCell className="font-mono text-xs">{t.ticketNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-muted-foreground shrink-0" />
                      <span className="text-sm">{t.clinic}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{t.itemName}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{t.serialNumber}</TableCell>
                  <TableCell>
                    <Badge className={`gap-1 text-xs ${ticketStatusColors[t.status]}`} variant="secondary">
                      {statusIcons[t.status]}
                      {ticketStatusLabels[t.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className={`text-xs ${ticketPriorityColors[t.priority]}`} variant="secondary">
                      {ticketPriorityLabels[t.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(t.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTicketWizard open={showWizard} onOpenChange={setShowWizard} onCreated={handleTicketCreated} />
    </div>
  );
}

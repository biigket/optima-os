import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  LayoutDashboard, Clock, Handshake, MapPin, FileText, CheckSquare,
  Eye, Phone as PhoneIcon, Presentation, Users, FileCheck, Wrench, GraduationCap, MessageSquare, Camera, FlaskConical, User, Star,
  FolderOpen, Upload, Download, Trash2, FileIcon, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTimelineForAccount, getVisitsForAccount,
  getLifetimeRevenue, getDevicesForAccount
} from '@/data/customerCardMockData';

import { supabase } from '@/integrations/supabase/client';
import type { OpportunityNote } from '@/hooks/useOpportunityNotes';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface VisitReportRow {
  id: string;
  account_id: string | null;
  clinic_name: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status: string | null;
  action: string | null;
  met_who: string | null;
  devices_in_use: string | null;
  issues: string | null;
  next_plan: string | null;
  customer_type: string | null;
  photo: string | null;
  created_at: string;
}

interface Opportunity {
  id: string;
  account_id: string;
  stage: string;
  interested_products?: string[];
  expected_value?: number;
  assigned_sale?: string;
  close_date?: string;
}

interface Props {
  accountId: string;
  opportunities: Opportunity[];
}

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  VISIT: Eye, CALL: PhoneIcon, DEMO: Presentation, MEETING: Users,
  PROPOSAL: FileCheck, SERVICE: Wrench, TRAINING: GraduationCap,
};

const TIMELINE_COLORS: Record<string, string> = {
  VISIT: 'bg-blue-100 text-blue-700', CALL: 'bg-green-100 text-green-700',
  DEMO: 'bg-purple-100 text-purple-700', MEETING: 'bg-amber-100 text-amber-700',
  PROPOSAL: 'bg-indigo-100 text-indigo-700', SERVICE: 'bg-orange-100 text-orange-700',
  TRAINING: 'bg-teal-100 text-teal-700',
};

function formatCurrency(val?: number) {
  if (!val) return '฿0';
  return `฿${val.toLocaleString()}`;
}

export default function CustomerCenterPanel({ accountId, opportunities }: Props) {
  const timeline = getTimelineForAccount(accountId);
  const visits = getVisitsForAccount(accountId);
  const devices = getDevicesForAccount(accountId);
  const revenue = getLifetimeRevenue(accountId);
  const [tasks, setTasks] = useState<any[]>([]);
  const [internalNotes, setInternalNotes] = useState<OpportunityNote[]>([]);
  const [visitReports, setVisitReports] = useState<VisitReportRow[]>([]);
  const [demoReports, setDemoReports] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docUploading, setDocUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase.from('account_documents').select('*').eq('account_id', accountId).order('created_at', { ascending: false });
    if (data) setDocuments(data);
  }, [accountId]);

  useEffect(() => {
    supabase.from('opportunity_notes').select('*').eq('account_id', accountId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setInternalNotes(data as unknown as OpportunityNote[]); });

    supabase.from('visit_reports').select('*').eq('account_id', accountId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVisitReports(data as unknown as VisitReportRow[]); });

    supabase.from('demos').select('*, accounts(clinic_name)').eq('account_id', accountId).eq('report_submitted', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setDemoReports(data); });

    supabase.from('activities').select('id, title, activity_type, activity_date, is_done, priority').eq('account_id', accountId).order('activity_date', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setTasks(data.map(a => ({ workItemId: a.id, title: a.title, status: a.is_done ? 'DONE' : 'OPEN', priority: a.priority || 'NORMAL', dueDateTime: a.activity_date }))); });

    fetchDocuments();
  }, [accountId, fetchDocuments]);

  const handleDocUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDocUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${accountId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('account-documents').upload(path, file);
      if (uploadErr) { console.error(uploadErr); continue; }
      const { data: urlData } = supabase.storage.from('account-documents').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('account_documents').insert({
        account_id: accountId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type || null,
      });
      if (!dbErr) successCount++;
    }
    if (successCount > 0) {
      toast.success(`อัปโหลดสำเร็จ ${successCount} ไฟล์`);
      fetchDocuments();
    }
    setDocUploading(false);
  };

  const handleDocDelete = async (doc: any) => {
    if (!confirm(`ลบไฟล์ "${doc.file_name}" ?`)) return;
    // Extract storage path from URL
    const urlParts = doc.file_url.split('/account-documents/');
    if (urlParts.length > 1) {
      await supabase.storage.from('account-documents').remove([decodeURIComponent(urlParts[1])]);
    }
    await supabase.from('account_documents').delete().eq('id', doc.id);
    toast.success('ลบเอกสารแล้ว');
    fetchDocuments();
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const lastVisit = visits.length > 0 ? visits[0].date : '-';
  const activeDeals = opportunities.filter(o => !['WON', 'LOST', 'CLOSED'].includes(o.stage)).length;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Tabs defaultValue="overview">
        <div className="border-b">
          <ScrollArea className="w-full">
            <TabsList className="bg-transparent h-auto p-0 w-max">
              <TabsTrigger value="overview" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <LayoutDashboard size={13} /> ภาพรวม
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Clock size={13} /> ไทม์ไลน์
              </TabsTrigger>
              <TabsTrigger value="deals" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <Handshake size={13} /> ดีล
              </TabsTrigger>
              <TabsTrigger value="visits" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <MapPin size={13} /> การเยี่ยม
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <MessageSquare size={13} /> บันทึกภายใน
                {internalNotes.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">{internalNotes.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <FileText size={13} /> บันทึกการเยี่ยม
                {visitReports.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">{visitReports.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="demo-reports" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <FlaskConical size={13} /> รายงานเคส DEMO
                {demoReports.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">{demoReports.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <CheckSquare size={13} /> งาน
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <FolderOpen size={13} /> เอกสาร
                {documents.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">{documents.length}</span>
                )}
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <div className="p-4">
          {/* Overview */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <KpiMini label="เยี่ยมล่าสุด" value={lastVisit} />
              <KpiMini label="ดีลที่เปิดอยู่" value={`${activeDeals} รายการ`} />
              <KpiMini label="รายได้รวม" value={formatCurrency(revenue)} />
              <KpiMini label="เครื่องที่ติดตั้ง" value={`${devices.length} เครื่อง`} />
              <KpiMini label="บันทึกภายใน" value={`${internalNotes.length} รายการ`} />
              <KpiMini label="แอคชั่นถัดไป" value={visits.length > 0 ? visits[0].nextStep : '-'} />
            </div>
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-0">
            <div className="space-y-4">
              {/* Show internal notes in timeline too */}
              {[...timeline.map(ev => ({ ...ev, isNote: false })), ...internalNotes.map(n => ({
                id: n.id,
                accountId: n.account_id,
                date: n.created_at.split('T')[0],
                user: n.created_by,
                type: 'NOTE' as const,
                description: `[บันทึก] ${n.content}`,
                isNote: true,
              }))].sort((a, b) => b.date.localeCompare(a.date)).map(ev => {
                const Icon = ev.isNote ? MessageSquare : (TIMELINE_ICONS[ev.type] || Clock);
                const colorClass = ev.isNote ? 'bg-primary/10 text-primary' : (TIMELINE_COLORS[ev.type] || 'bg-muted text-muted-foreground');
                return (
                  <div key={ev.id} className="flex gap-3 items-start">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${colorClass}`}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1 pb-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{ev.date}</span>
                        <span>•</span>
                        <span>{ev.user}</span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{ev.description}</p>
                    </div>
                  </div>
                );
              })}
              {timeline.length === 0 && internalNotes.length === 0 && <Empty text="ยังไม่มีกิจกรรม" />}
            </div>
          </TabsContent>

          {/* Deals */}
          <TabsContent value="deals" className="mt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">สินค้า</TableHead>
                    <TableHead className="text-xs">มูลค่า</TableHead>
                    <TableHead className="text-xs">ขั้นตอน</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">ปิดภายใน</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">เซลล์</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs">{(o.interested_products || []).join(', ') || '-'}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(o.expected_value)}</TableCell>
                      <TableCell><StatusBadge status={o.stage} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{o.close_date || '-'}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{o.assigned_sale || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {opportunities.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">ไม่มีดีล</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Visits */}
          <TabsContent value="visits" className="mt-0">
            <div className="space-y-3">
              {visits.map(v => (
                <div key={v.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{v.date}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{v.salesPerson}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{v.purpose}</p>
                  <p className="text-xs text-muted-foreground">{v.summary}</p>
                  <p className="text-xs text-primary">ถัดไป: {v.nextStep}</p>
                </div>
              ))}
              {visits.length === 0 && <Empty text="ยังไม่มีบันทึกการเยี่ยม" />}
            </div>
          </TabsContent>

          {/* Internal Notes */}
          <TabsContent value="notes" className="mt-0">
            <div className="space-y-3">
              {internalNotes.length > 0 ? internalNotes.map(n => (
                <div key={n.id} className="p-3 rounded-md bg-muted/30 border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-foreground">{n.created_by}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground">
                    จากโอกาสขาย: {n.opportunity_id}
                  </p>
                </div>
              )) : (
                <Empty text="ยังไม่มีบันทึกภายใน — บันทึกจากโอกาสขายจะแสดงที่นี่" />
              )}
            </div>
          </TabsContent>

          {/* Reports - Visit Reports */}
          <TabsContent value="reports" className="mt-0">
            <div className="space-y-3">
              {visitReports.map(r => (
                <div key={r.id} className="p-3 rounded-md bg-muted/30 border space-y-2">
                  {r.photo && (
                    <img src={r.photo} alt="check-in" className="w-full rounded-md aspect-[16/9] object-cover" />
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {r.check_in_at ? format(new Date(r.check_in_at), 'd MMM yyyy HH:mm', { locale: th }) : '-'}
                    </span>
                    <Badge variant={r.status === 'REPORTED' ? 'default' : 'secondary'} className="text-[10px] h-5">
                      {r.status === 'REPORTED' ? 'รายงานแล้ว' : 'รอกรอกรายงาน'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    {r.met_who && <p><span className="text-muted-foreground">พบ:</span> <span className="text-foreground">{r.met_who}</span></p>}
                    {r.action && <p><span className="text-muted-foreground">สิ่งที่ทำ:</span> <span className="text-foreground">{r.action}</span></p>}
                    {r.devices_in_use && <p><span className="text-muted-foreground">เครื่องมือ:</span> <span className="text-foreground">{r.devices_in_use}</span></p>}
                    {r.issues && <p><span className="text-muted-foreground">ปัญหา:</span> <span className="text-foreground">{r.issues}</span></p>}
                    {r.next_plan && <p className="text-primary">ถัดไป: {r.next_plan}</p>}
                    {r.customer_type && (
                      <p><span className="text-muted-foreground">ผลเยี่ยม:</span> <span className="text-foreground">
                        {r.customer_type === 'INTERESTED' ? 'สนใจ' : r.customer_type === 'NOT_INTERESTED' ? 'ไม่สนใจ' : 'ลูกค้าเก่า'}
                      </span></p>
                    )}
                  </div>
                </div>
              ))}
              {visitReports.length === 0 && <Empty text="ยังไม่มีบันทึกการเยี่ยม" />}
            </div>
          </TabsContent>


          {/* Demo Reports */}
          <TabsContent value="demo-reports" className="mt-0">
            <div className="space-y-4">
              {demoReports.map(demo => {
                const report = demo.report_data as Record<string, any> | null;
                const devices = Object.keys(report || {});
                return (
                  <div key={demo.id} className="p-4 rounded-md bg-muted/30 border space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FlaskConical size={14} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {demo.demo_date ? format(new Date(demo.demo_date), 'd MMM yyyy', { locale: th }) : '-'}
                        </span>
                      </div>
                      <Badge variant="default" className="text-[10px] h-5">เสร็จแล้ว</Badge>
                    </div>
                    {demo.location && (
                      <p className="text-xs text-muted-foreground"><MapPin size={11} className="inline mr-1" />{demo.location}</p>
                    )}
                    {devices.length > 0 ? devices.map(deviceName => {
                      const patients = (report![deviceName] as any[]) || [];
                      return (
                        <div key={deviceName} className="space-y-2">
                          <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Presentation size={12} /> {deviceName}
                            <span className="text-muted-foreground font-normal">({patients.length} คนไข้)</span>
                          </h4>
                          {patients.map((pt: any, idx: number) => (
                            <div key={idx} className="ml-3 p-3 rounded bg-background border space-y-2">
                              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <User size={11} /> คนไข้ #{idx + 1}
                              </p>
                              {pt.parameters && (
                                <div className="text-xs"><span className="text-muted-foreground">Parameters:</span> <span className="text-foreground">{pt.parameters}</span></div>
                              )}
                              {pt.feeling && (
                                <div className="text-xs"><span className="text-muted-foreground">Feeling:</span> <span className="text-foreground">{pt.feeling}</span></div>
                              )}
                              {pt.painScore !== undefined && pt.painScore !== null && (
                                <div className="text-xs flex items-center gap-1.5">
                                  <span className="text-muted-foreground">Pain Score:</span>
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full rounded-full" style={{
                                        width: `${(pt.painScore / 10) * 100}%`,
                                        backgroundColor: pt.painScore <= 3 ? 'hsl(var(--primary))' : pt.painScore <= 6 ? 'hsl(40,90%,50%)' : 'hsl(0,70%,50%)'
                                      }} />
                                    </div>
                                    <span className="font-semibold text-foreground">{pt.painScore}/10</span>
                                  </div>
                                </div>
                              )}
                              {pt.satisfaction && (
                                <div className="text-xs flex items-center gap-1">
                                  <span className="text-muted-foreground">Satisfaction:</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star key={s} size={11} className={s <= (pt.satisfaction || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {pt.sideEffects && (
                                <div className="text-xs"><span className="text-muted-foreground">ผลข้างเคียง:</span> <span className="text-foreground">{pt.sideEffects}</span></div>
                              )}
                              {pt.presentation && (
                                <div className="text-xs"><span className="text-muted-foreground">สิ่งที่นำเสนอ:</span> <span className="text-foreground">{pt.presentation}</span></div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-muted-foreground">ไม่มีข้อมูลรายงาน</p>
                    )}
                    {demo.demo_note && (
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">หมายเหตุ: {demo.demo_note}</p>
                    )}
                  </div>
                );
              })}
              {demoReports.length === 0 && <Empty text="ยังไม่มีรายงานเคส DEMO" />}
            </div>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="mt-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">งาน</TableHead>
                    <TableHead className="text-xs">สถานะ</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">ความสำคัญ</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">กำหนด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(t => (
                    <TableRow key={t.workItemId}>
                      <TableCell className="text-xs">{t.title}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={t.priority === 'URGENT' ? 'destructive' : t.priority === 'HIGH' ? 'default' : 'secondary'} className="text-[10px]">
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{t.dueDateTime?.split('T')[0] || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">ไม่มีงาน</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-0 space-y-4">
            {/* Drag & Drop Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
              onClick={() => docInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleDocUpload(e.dataTransfer.files); }}
            >
              <input
                ref={docInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => { handleDocUpload(e.target.files); if (e.target) e.target.value = ''; }}
              />
              {docUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">กำลังอัปโหลด...</span>
                </div>
              ) : (
                <>
                  <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-muted-foreground mt-1">รองรับทุกประเภทไฟล์ — สัญญา, ใบเสร็จ, เอกสารเก่า ฯลฯ</p>
                </>
              )}
            </div>

            {/* Documents List */}
            {documents.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ชื่อไฟล์</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">ขนาด</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">วันที่อัปโหลด</TableHead>
                      <TableHead className="text-xs text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <FileIcon size={14} className="text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[200px]">{doc.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          {format(new Date(doc.created_at), 'd MMM yy', { locale: th })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="ดาวน์โหลด">
                                <Download size={14} />
                              </a>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDocDelete(doc)} title="ลบ">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Empty text="ยังไม่มีเอกสาร — อัปโหลดไฟล์เพื่อเริ่มเก็บข้อมูล" />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-muted/40">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground text-center py-8">{text}</p>;
}

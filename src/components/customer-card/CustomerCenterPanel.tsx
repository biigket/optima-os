import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  LayoutDashboard, Clock, Handshake, MapPin, FileText, CheckSquare,
  Eye, Phone as PhoneIcon, Presentation, Users, FileCheck, Wrench, GraduationCap, MessageSquare, Camera
} from 'lucide-react';
import {
  getTimelineForAccount, getVisitsForAccount,
  getLifetimeRevenue, getDevicesForAccount
} from '@/data/customerCardMockData';
import { mockWorkItems, type WorkItem } from '@/data/mockData';
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
  const tasks = mockWorkItems.filter((w: WorkItem) => w.linkedAccountId === accountId);
  const [internalNotes, setInternalNotes] = useState<OpportunityNote[]>([]);
  const [visitReports, setVisitReports] = useState<VisitReportRow[]>([]);

  useEffect(() => {
    supabase.from('opportunity_notes').select('*').eq('account_id', accountId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setInternalNotes(data as unknown as OpportunityNote[]); });

    supabase.from('visit_reports').select('*').eq('account_id', accountId).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setVisitReports(data as unknown as VisitReportRow[]); });
  }, [accountId]);

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
                <FileText size={13} /> รายงาน
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-2.5">
                <CheckSquare size={13} /> งาน
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

          {/* Reports */}
          <TabsContent value="reports" className="mt-0">
            <div className="space-y-3">
              {reports.map(r => (
                <div key={r.id} className="p-3 rounded-md bg-muted/30 border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                    <Badge variant={r.interestLevel === 'HIGH' ? 'default' : 'secondary'} className="text-[10px] h-5">
                      สนใจ: {r.interestLevel}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-muted-foreground">Feedback:</span> <span className="text-foreground">{r.doctorFeedback}</span></p>
                    <p><span className="text-muted-foreground">คู่แข่ง:</span> <span className="text-foreground">{r.competitorMentioned}</span></p>
                    <p><span className="text-muted-foreground">ข้อโต้แย้ง:</span> <span className="text-foreground">{r.objections}</span></p>
                  </div>
                </div>
              ))}
              {reports.length === 0 && <Empty text="ยังไม่มีรายงาน" />}
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

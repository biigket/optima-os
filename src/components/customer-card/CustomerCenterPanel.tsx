import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  LayoutDashboard, Clock, Handshake, MapPin, FileText, CheckSquare,
  Eye, Phone as PhoneIcon, Presentation, Users, FileCheck, Wrench, GraduationCap
} from 'lucide-react';
import {
  getTimelineForAccount, getVisitsForAccount, getReportsForAccount,
  getLifetimeRevenue, getDevicesForAccount, type TimelineEvent
} from '@/data/customerCardMockData';
import { mockWorkItems, type WorkItem } from '@/data/mockData';

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

function KpiMini({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function CustomerCenterPanel({ accountId, opportunities }: Props) {
  const timeline = getTimelineForAccount(accountId);
  const visits = getVisitsForAccount(accountId);
  const reports = getReportsForAccount(accountId);
  const devices = getDevicesForAccount(accountId);
  const revenue = getLifetimeRevenue(accountId);
  const tasks = mockWorkItems.filter((w: WorkItem) => w.linkedAccountId === accountId);

  const lastVisit = visits.length > 0 ? visits[0].date : '-';
  const activeDeals = opportunities.filter(o => !['WON', 'LOST', 'CLOSED'].includes(o.stage)).length;

  return (
    <Tabs defaultValue="overview" className="h-full">
      <TabsList className="w-full justify-start bg-muted/50 rounded-lg h-auto flex-wrap">
        <TabsTrigger value="overview" className="text-xs gap-1"><LayoutDashboard size={13} /> ภาพรวม</TabsTrigger>
        <TabsTrigger value="timeline" className="text-xs gap-1"><Clock size={13} /> ไทม์ไลน์</TabsTrigger>
        <TabsTrigger value="deals" className="text-xs gap-1"><Handshake size={13} /> ดีล</TabsTrigger>
        <TabsTrigger value="visits" className="text-xs gap-1"><MapPin size={13} /> การเยี่ยม</TabsTrigger>
        <TabsTrigger value="reports" className="text-xs gap-1"><FileText size={13} /> รายงาน</TabsTrigger>
        <TabsTrigger value="tasks" className="text-xs gap-1"><CheckSquare size={13} /> งาน</TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview" className="mt-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KpiMini label="เยี่ยมล่าสุด" value={lastVisit} />
          <KpiMini label="ดีลที่เปิดอยู่" value={`${activeDeals} รายการ`} />
          <KpiMini label="รายได้รวม" value={formatCurrency(revenue)} />
          <KpiMini label="เครื่องที่ติดตั้ง" value={`${devices.length} เครื่อง`} />
          <KpiMini label="สั่ง Cartridge ล่าสุด" value={visits.length > 0 ? visits[0].date : '-'} />
          <KpiMini label="แอคชั่นถัดไป" value={visits.length > 0 ? visits[0].nextStep : '-'} />
        </div>
      </TabsContent>

      {/* Timeline */}
      <TabsContent value="timeline" className="mt-4">
        <div className="space-y-3">
          {timeline.map(ev => {
            const Icon = TIMELINE_ICONS[ev.type] || Clock;
            const colorClass = TIMELINE_COLORS[ev.type] || 'bg-muted text-muted-foreground';
            return (
              <div key={ev.id} className="flex gap-3 items-start">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${colorClass}`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
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
          {timeline.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีกิจกรรม</p>}
        </div>
      </TabsContent>

      {/* Deals */}
      <TabsContent value="deals" className="mt-4">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>มูลค่า</TableHead>
                <TableHead>ขั้นตอน</TableHead>
                <TableHead>ปิดภายใน</TableHead>
                <TableHead>เซลล์</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="text-sm">{(o.interested_products || []).join(', ') || '-'}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(o.expected_value)}</TableCell>
                  <TableCell><StatusBadge status={o.stage} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.close_date || '-'}</TableCell>
                  <TableCell className="text-sm">{o.assigned_sale || '-'}</TableCell>
                </TableRow>
              ))}
              {opportunities.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่มีดีล</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Visits */}
      <TabsContent value="visits" className="mt-4">
        <div className="space-y-3">
          {visits.map(v => (
            <Card key={v.id} className="shadow-sm">
              <CardContent className="p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{v.date}</span>
                  <Badge variant="outline" className="text-xs">{v.salesPerson}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{v.purpose}</p>
                <p className="text-sm text-muted-foreground">{v.summary}</p>
                <p className="text-xs text-accent">ถัดไป: {v.nextStep}</p>
              </CardContent>
            </Card>
          ))}
          {visits.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีบันทึกการเยี่ยม</p>}
        </div>
      </TabsContent>

      {/* Reports */}
      <TabsContent value="reports" className="mt-4">
        <div className="space-y-3">
          {reports.map(r => (
            <Card key={r.id} className="shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                  <Badge variant={r.interestLevel === 'HIGH' ? 'default' : 'secondary'} className="text-xs">
                    สนใจ: {r.interestLevel}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Feedback:</span> {r.doctorFeedback}</p>
                  <p><span className="text-muted-foreground">คู่แข่ง:</span> {r.competitorMentioned}</p>
                  <p><span className="text-muted-foreground">ข้อโต้แย้ง:</span> {r.objections}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีรายงาน</p>}
        </div>
      </TabsContent>

      {/* Tasks */}
      <TabsContent value="tasks" className="mt-4">
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>งาน</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>กำหนด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(t => (
                <TableRow key={t.workItemId}>
                  <TableCell className="text-sm">{t.title}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell>
                    <Badge variant={t.priority === 'URGENT' ? 'destructive' : t.priority === 'HIGH' ? 'default' : 'secondary'} className="text-xs">
                      {t.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.dueDateTime?.split('T')[0] || '-'}</TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">ไม่มีงาน</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}

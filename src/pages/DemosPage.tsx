import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Calendar, MapPin, Building2, Plus, Users, FileText, Search, CheckCircle2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import CreateDemoWizard from '@/components/demos/CreateDemoWizard';
import EditDemoDialog from '@/components/demos/EditDemoDialog';
import ConfirmDemoDialog from '@/components/demos/ConfirmDemoDialog';
import DemoReportDialog from '@/components/demos/DemoReportDialog';

interface DemoRow {
  id: string;
  account_id: string | null;
  opportunity_id: string | null;
  demo_date: string | null;
  location: string | null;
  products_demo: string[] | null;
  demo_note: string | null;
  visited_by: string[] | null;
  reminded: boolean | null;
  confirmed: boolean | null;
  report_data: any;
  report_submitted: boolean | null;
  created_at: string;
}

interface AccountInfo {
  id: string;
  clinic_name: string;
  assigned_sale: string | null;
}

export default function DemosPage() {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [accounts, setAccounts] = useState<Record<string, AccountInfo>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit dialog state
  const [editDemo, setEditDemo] = useState<DemoRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Confirm dialog state
  const [confirmDemo, setConfirmDemo] = useState<DemoRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Report dialog state
  const [reportDemo, setReportDemo] = useState<DemoRow | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [demosRes, accRes] = await Promise.all([
      supabase.from('demos').select('*').order('demo_date', { ascending: false }),
      supabase.from('accounts').select('id, clinic_name, assigned_sale'),
    ]);

    if (demosRes.data) setDemos(demosRes.data as unknown as DemoRow[]);
    if (accRes.data) {
      const map: Record<string, AccountInfo> = {};
      (accRes.data as unknown as AccountInfo[]).forEach(a => { map[a.id] = a; });
      setAccounts(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    return demos.filter(d => {
      const acc = d.account_id ? accounts[d.account_id] : null;
      const matchSearch = !search || acc?.clinic_name.toLowerCase().includes(search.toLowerCase());
      const isConfirmed = !!d.confirmed;
      const isDone = !!d.report_submitted || (d.demo_date != null && d.demo_date < today);
      if (statusFilter === 'ALL') return matchSearch && !isConfirmed && !isDone; // ขอคิวเดโม
      if (statusFilter === 'UPCOMING') return matchSearch && isConfirmed && !isDone; // ได้คิวแล้ว
      if (statusFilter === 'PAST') return matchSearch && isDone; // เสร็จแล้ว
      return matchSearch;
    });
  }, [demos, accounts, search, statusFilter, today]);

  const isDone = (d: DemoRow) => !!d.report_submitted || (d.demo_date != null && d.demo_date < today);
  const pendingCount = demos.filter(d => !d.confirmed && !isDone(d)).length;
  const confirmedCount = demos.filter(d => !!d.confirmed && !isDone(d)).length;
  const pastCount = demos.filter(d => isDone(d)).length;

  function handleCardClick(demo: DemoRow) {
    const acc = demo.account_id ? accounts[demo.account_id] : null;
    setEditDemo(demo);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">สาธิตสินค้า</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{demos.length} รายการ</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-orange-600 font-medium">{pendingCount} ขอคิวเดโม</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-emerald-600 font-medium">{confirmedCount} ได้คิวแล้ว</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{pastCount} เสร็จแล้ว</span>
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> สร้างใบงาน Demo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="ค้นหาคลินิก..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          {(['ALL', 'UPCOMING', 'PAST'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {s === 'ALL' ? 'ขอคิวเดโม' : s === 'UPCOMING' ? 'ได้คิวแล้ว' : 'เสร็จแล้ว'}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          ยังไม่มีใบงานสาธิต — กดปุ่ม "สร้างใบงาน Demo" หรือสร้าง Activity Demo ใน Pipeline
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(demo => {
            const acc = demo.account_id ? accounts[demo.account_id] : null;
            const isConfirmed = !!demo.confirmed;
            const isPast = demo.demo_date && demo.demo_date < today;

            return (
              <div
                key={demo.id}
                className={cn(
                  "rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow",
                  isPast && "opacity-70"
                )}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => handleCardClick(demo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-600"
                          : isPast
                            ? "bg-muted text-muted-foreground"
                            : "bg-orange-100 text-orange-600"
                      )}>
                        <Presentation size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{acc?.clinic_name || 'ไม่ระบุ'}</p>
                        <Badge
                          variant={isPast ? 'secondary' : isConfirmed ? 'default' : 'outline'}
                          className={cn(
                            "text-[10px] mt-0.5",
                            isConfirmed && !isPast && "bg-emerald-100 text-emerald-700 border-emerald-200",
                            !isConfirmed && !isPast && "bg-orange-100 text-orange-700 border-orange-200"
                          )}
                        >
                          {isPast ? 'เสร็จแล้ว' : isConfirmed ? '✓ ได้คิวแล้ว' : 'ขอคิวเดโม'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground mt-3">
                    {demo.demo_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span className="font-medium text-foreground">
                          {format(new Date(demo.demo_date), 'd MMM yyyy', { locale: th })}
                        </span>
                      </div>
                    )}
                    {demo.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{demo.location}</span>
                      </div>
                    )}
                    {demo.visited_by && demo.visited_by.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users size={12} />
                        <span>{demo.visited_by.join(', ')}</span>
                      </div>
                    )}
                    {demo.products_demo && demo.products_demo.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FileText size={12} />
                        <span>{demo.products_demo.join(', ')}</span>
                      </div>
                    )}
                    {demo.demo_note && (
                      <p className="text-muted-foreground mt-1 line-clamp-2">{demo.demo_note}</p>
                    )}
                  </div>
                </div>

                {/* Confirm button - only show for unconfirmed upcoming demos */}
                {!isConfirmed && !isPast && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDemo(demo);
                      setConfirmOpen(true);
                    }}
                  >
                    <CheckCircle2 size={14} />
                    ยืนยันวันเดโม
                  </Button>
                )}

                {/* Report button - only show for confirmed, not yet reported */}
                {isConfirmed && !isPast && !demo.report_submitted && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportDemo(demo);
                      setReportOpen(true);
                    }}
                  >
                    <ClipboardList size={14} />
                    รายงาน DEMO
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateDemoWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchData}
      />

      <EditDemoDialog
        demo={editDemo}
        clinicName={editDemo?.account_id ? (accounts[editDemo.account_id]?.clinic_name || 'ไม่ระบุ') : 'ไม่ระบุ'}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={fetchData}
        onDeleted={fetchData}
      />

      <ConfirmDemoDialog
        demoId={confirmDemo?.id || ''}
        currentDate={confirmDemo?.demo_date || null}
        opportunityId={confirmDemo?.opportunity_id || null}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirmed={fetchData}
      />

      <DemoReportDialog
        demoId={reportDemo?.id || ''}
        clinicName={reportDemo?.account_id ? (accounts[reportDemo.account_id]?.clinic_name || 'ไม่ระบุ') : 'ไม่ระบุ'}
        productsDemoed={reportDemo?.products_demo || []}
        existingReport={reportDemo?.report_data || null}
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSaved={fetchData}
      />
    </div>
  );
}

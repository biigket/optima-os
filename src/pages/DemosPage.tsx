import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Calendar, MapPin, Building2, Plus, Users, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import CreateDemoWizard from '@/components/demos/CreateDemoWizard';

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


  const fetchData = async () => {
    setLoading(true);
    const [demosRes, accRes] = await Promise.all([
      supabase.from('demos').select('*').order('demo_date', { ascending: false }),
      supabase.from('accounts').select('id, clinic_name, assigned_sale'),
    ]);

    if (demosRes.data) setDemos(demosRes.data as unknown as DemoRow[]);
    if (accRes.data) {
      const map: Record<string, AccountInfo> = {};
      (accRes.data as AccountInfo[]).forEach(a => { map[a.id] = a; });
      setAccounts(map);
      setAllAccounts(accRes.data as AccountInfo[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    return demos.filter(d => {
      const acc = d.account_id ? accounts[d.account_id] : null;
      const matchSearch = !search || acc?.clinic_name.toLowerCase().includes(search.toLowerCase());
      if (statusFilter === 'UPCOMING') return matchSearch && d.demo_date && d.demo_date >= today;
      if (statusFilter === 'PAST') return matchSearch && d.demo_date && d.demo_date < today;
      return matchSearch;
    });
  }, [demos, accounts, search, statusFilter, today]);

  const upcomingCount = demos.filter(d => d.demo_date && d.demo_date >= today).length;
  const pastCount = demos.filter(d => d.demo_date && d.demo_date < today).length;

  const filteredAccounts = allAccounts.filter(a =>
    a.clinic_name.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const handleCreateDemo = async () => {
    if (!selectedAccountId || !demoDate) {
      toast.error('กรุณาเลือกลูกค้าและวันที่');
      return;
    }

    setSaving(true);
    const acc = accounts[selectedAccountId];

    // Ensure opportunity exists at DEMO_SCHEDULED
    const oppId = await ensureOpportunityForDemo({
      accountId: selectedAccountId,
      assignedSale: acc?.assigned_sale || currentUser?.name,
    });

    // Create demo record
    const { error } = await supabase.from('demos').insert({
      account_id: selectedAccountId,
      opportunity_id: oppId,
      demo_date: format(demoDate, 'yyyy-MM-dd'),
      location: demoLocation || null,
      demo_note: demoNote || null,
      visited_by: currentUser ? [currentUser.name] : null,
    });

    setSaving(false);
    if (error) {
      toast.error('สร้างใบงานไม่สำเร็จ');
      return;
    }

    toast.success('สร้างใบงานสาธิต + เลื่อน Pipeline เป็น Demo Schedule แล้ว');
    setCreateOpen(false);
    setSelectedAccountId('');
    setDemoDate(undefined);
    setDemoLocation('');
    setDemoNote('');
    setAccountSearch('');
    fetchData();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">สาธิตสินค้า</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{demos.length} รายการ</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-emerald-600 font-medium">{upcomingCount} กำลังจะมา</span>
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
              {s === 'ALL' ? 'ทั้งหมด' : s === 'UPCOMING' ? 'กำลังจะมา' : 'เสร็จแล้ว'}
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
            const isUpcoming = demo.demo_date && demo.demo_date >= today;
            const isPast = demo.demo_date && demo.demo_date < today;

            return (
              <div
                key={demo.id}
                className={cn(
                  "rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer",
                  isPast && "opacity-70"
                )}
                onClick={() => demo.opportunity_id && navigate(`/opportunities/${demo.opportunity_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isUpcoming ? "bg-orange-100 text-orange-600" : "bg-muted text-muted-foreground"
                    )}>
                      <Presentation size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{acc?.clinic_name || 'ไม่ระบุ'}</p>
                      <Badge variant={isUpcoming ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                        {isUpcoming ? 'กำลังจะมา' : 'เสร็จแล้ว'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
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
            );
          })}
        </div>
      )}

      {/* Create Demo Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Presentation size={18} /> สร้างใบงานสาธิตสินค้า
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Account Search & Select */}
            <div>
              <Label className="text-xs">คลินิก / ลูกค้า</Label>
              <Input
                placeholder="ค้นหาลูกค้า..."
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                className="h-8 text-xs mt-1"
              />
              {accountSearch && (
                <div className="mt-1 max-h-32 overflow-y-auto border rounded-md">
                  {filteredAccounts.slice(0, 8).map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAccountId(a.id);
                        setAccountSearch(a.clinic_name);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2",
                        selectedAccountId === a.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <Building2 size={12} />
                      {a.clinic_name}
                    </button>
                  ))}
                </div>
              )}
              {selectedAccountId && (
                <p className="text-[11px] text-primary mt-1">✓ เลือก: {accounts[selectedAccountId]?.clinic_name || allAccounts.find(a => a.id === selectedAccountId)?.clinic_name}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label className="text-xs">วันที่สาธิต</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-8 text-xs justify-start mt-1", !demoDate && "text-muted-foreground")}>
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {demoDate ? format(demoDate, 'd MMM yyyy', { locale: th }) : 'เลือกวันที่'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" selected={demoDate} onSelect={setDemoDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div>
              <Label className="text-xs">สถานที่</Label>
              <Input
                placeholder="เช่น คลินิก, โรงพยาบาล..."
                value={demoLocation}
                onChange={e => setDemoLocation(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Note */}
            <div>
              <Label className="text-xs">หมายเหตุ</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม..."
                value={demoNote}
                onChange={e => setDemoNote(e.target.value)}
                className="text-xs min-h-[60px] mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>ยกเลิก</Button>
              <Button size="sm" onClick={handleCreateDemo} disabled={saving}>
                {saving ? 'กำลังสร้าง...' : 'สร้างใบงาน'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

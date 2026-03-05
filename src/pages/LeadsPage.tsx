import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, SlidersHorizontal, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/ui/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type Account = Tables<'accounts'>;
type Contact = Tables<'contacts'>;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'NEW_LEAD', label: 'ลูกค้าใหม่' },
  { value: 'CONTACTED', label: 'ติดต่อแล้ว' },
  { value: 'DEMO_SCHEDULED', label: 'นัดสาธิต' },
  { value: 'DEMO_DONE', label: 'สาธิตแล้ว' },
  { value: 'NEGOTIATION', label: 'เจรจา' },
  { value: 'PURCHASED', label: 'ลูกค้า' },
  { value: 'DORMANT', label: 'ไม่เคลื่อนไหว' },
  { value: 'CLOSED', label: 'ปิด' },
];

const ENTITY_TYPES = ['บุคคลธรรมดา', 'นิติบุคคล', 'คลินิก', 'โรงพยาบาล'];
const BRANCH_TYPES = ['สำนักงานใหญ่', 'สาขา'];

const emptyForm: Partial<TablesInsert<'accounts'>> = {
  clinic_name: '',
  company_name: '',
  address: '',
  tax_id: '',
  entity_type: '',
  branch_type: '',
  phone: '',
  email: '',
  customer_status: 'NEW_LEAD',
  assigned_sale: '',
  lead_source: '',
  notes: '',
  grade: '',
  single_or_chain: '',
};

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status.replace(/_/g, ' ');
}

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'วันนี้';
  return `${diff} วัน`;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*');
      if (error) throw error;
      return data as Contact[];
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (newAccount: TablesInsert<'accounts'>) => {
      const { error } = await supabase.from('accounts').insert(newAccount);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('เพิ่มลูกค้าสำเร็จ');
      closeDialog();
    },
    onError: (err: Error) => toast.error('เกิดข้อผิดพลาด: ' + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { error } = await supabase.from('accounts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('อัปเดตลูกค้าสำเร็จ');
      closeDialog();
    },
    onError: (err: Error) => toast.error('เกิดข้อผิดพลาด: ' + err.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setForm(emptyForm);
  };

  const openAdd = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      clinic_name: account.clinic_name,
      company_name: account.company_name || '',
      address: account.address || '',
      tax_id: account.tax_id || '',
      entity_type: account.entity_type || '',
      branch_type: account.branch_type || '',
      phone: account.phone || '',
      email: account.email || '',
      customer_status: account.customer_status,
      assigned_sale: account.assigned_sale || '',
      lead_source: account.lead_source || '',
      notes: account.notes || '',
      grade: account.grade || '',
      single_or_chain: account.single_or_chain || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.clinic_name?.trim()) {
      toast.error('กรุณากรอกชื่อคลินิก');
      return;
    }
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, ...form });
    } else {
      insertMutation.mutate(form as TablesInsert<'accounts'>);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const filtered = accounts.filter(a => {
    const matchStatus = statusFilter === 'ALL' || a.customer_status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.clinic_name.toLowerCase().includes(q) ||
      (a.company_name || '').toLowerCase().includes(q) ||
      (a.address || '').toLowerCase().includes(q) ||
      (a.assigned_sale || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const isSaving = insertMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} ราย จากทั้งหมด {accounts.length} ราย</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal size={14} /> ตัวกรอง
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus size={14} /> เพิ่มลูกค้า
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="h-auto flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <TabsTrigger key={s.value} value={s.value} className="text-xs">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">คลินิก</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เซลล์</TableHead>
                <TableHead>เกรด</TableHead>
                <TableHead>แหล่งที่มา</TableHead>
                <TableHead className="text-right">สร้างเมื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(account => {
                const primaryContact = contacts.find(c => c.account_id === account.id);
                return (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openEdit(account)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                          {account.address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{account.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {primaryContact ? (
                        <div>
                          <p className="text-sm text-foreground">{primaryContact.name}</p>
                          {primaryContact.phone && (
                            <p className="text-xs text-muted-foreground">{primaryContact.phone}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={account.customer_status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{account.assigned_sale || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{account.grade || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{account.lead_source || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">{daysSince(account.created_at)}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    ไม่พบลูกค้า
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'แก้ไขข้อมูลลูกค้าและกดบันทึก' : 'กรอกข้อมูลลูกค้าใหม่'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อคลินิก *</Label>
              <Input value={form.clinic_name || ''} onChange={e => updateField('clinic_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อบริษัท</Label>
              <Input value={form.company_name || ''} onChange={e => updateField('company_name', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>ที่อยู่</Label>
              <Input value={form.address || ''} onChange={e => updateField('address', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>เลขประจำตัวผู้เสียภาษี</Label>
              <Input value={form.tax_id || ''} onChange={e => updateField('tax_id', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทนิติบุคคล</Label>
              <Select value={form.entity_type || ''} onValueChange={v => updateField('entity_type', v)}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทสาขา</Label>
              <Select value={form.branch_type || ''} onValueChange={v => updateField('branch_type', v)}>
                <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                <SelectContent>
                  {BRANCH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>โทรศัพท์</Label>
              <Input value={form.phone || ''} onChange={e => updateField('phone', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>อีเมล</Label>
              <Input type="email" value={form.email || ''} onChange={e => updateField('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={form.customer_status || 'NEW_LEAD'} onValueChange={v => updateField('customer_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.filter(s => s.value !== 'ALL').map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>เซลล์ผู้ดูแล</Label>
              <Input value={form.assigned_sale || ''} onChange={e => updateField('assigned_sale', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>แหล่งที่มา</Label>
              <Input value={form.lead_source || ''} onChange={e => updateField('lead_source', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>เกรด</Label>
              <Input value={form.grade || ''} onChange={e => updateField('grade', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={form.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccount ? 'บันทึก' : 'เพิ่มลูกค้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

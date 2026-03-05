import { useState } from 'react';
import { Search, Plus, SlidersHorizontal, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';
import { useMockAuth, MOCK_SALES } from '@/hooks/useMockAuth';

interface Account {
  id: string;
  clinic_name: string;
  company_name: string | null;
  address: string | null;
  tax_id: string | null;
  entity_type: string | null;
  branch_type: string | null;
  phone: string | null;
  email: string | null;
  customer_status: string;
  assigned_sale: string | null;
  lead_source: string | null;
  notes: string | null;
  grade: string | null;
  single_or_chain: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  account_id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
}

// ── Mock Data ──
const mockAccounts: Account[] = [
  { id: '1', clinic_name: 'Clarity Clinic', company_name: 'Clarity Co., Ltd.', address: 'สุขุมวิท 39, กรุงเทพฯ', tax_id: null, entity_type: 'คลินิก', branch_type: 'สำนักงานใหญ่', phone: '02-123-4567', email: 'info@clarity.co.th', customer_status: 'DEMO_SCHEDULED', assigned_sale: 'FORD', lead_source: 'งานแสดงสินค้า', notes: null, grade: 'A', single_or_chain: 'สาขาเดียว', created_at: '2026-03-02T10:00:00' },
  { id: '2', clinic_name: 'Aura Med Spa', company_name: 'Aura Group', address: 'นิมมานเหมินทร์, เชียงใหม่', tax_id: null, entity_type: 'คลินิก', branch_type: 'สำนักงานใหญ่', phone: '053-222-333', email: 'hello@aura.co.th', customer_status: 'PURCHASED', assigned_sale: 'VARN', lead_source: 'แนะนำ', notes: null, grade: 'A', single_or_chain: 'เชน', created_at: '2026-02-28T09:00:00' },
  { id: '3', clinic_name: 'Derma Plus', company_name: null, address: 'พัทยาใต้, ชลบุรี', tax_id: null, entity_type: 'คลินิก', branch_type: null, phone: '038-111-222', email: null, customer_status: 'NEW_LEAD', assigned_sale: 'PETCH', lead_source: 'เว็บไซต์', notes: null, grade: 'B', single_or_chain: 'สาขาเดียว', created_at: '2026-03-04T14:00:00' },
  { id: '4', clinic_name: 'Skin Lab Bangkok', company_name: 'Skin Lab Co., Ltd.', address: 'ทองหล่อ ซอย 10, กรุงเทพฯ', tax_id: null, entity_type: 'นิติบุคคล', branch_type: 'สำนักงานใหญ่', phone: '02-999-8888', email: 'contact@skinlab.co.th', customer_status: 'NEGOTIATION', assigned_sale: 'FAH', lead_source: 'งานแสดงสินค้า', notes: 'สนใจ Doublo Gold', grade: 'A', single_or_chain: 'เชน', created_at: '2026-02-25T11:00:00' },
  { id: '5', clinic_name: 'Glow Aesthetic', company_name: null, address: 'หาดใหญ่, สงขลา', tax_id: null, entity_type: 'คลินิก', branch_type: null, phone: '074-333-444', email: 'glow@email.com', customer_status: 'CONTACTED', assigned_sale: 'VI', lead_source: 'Facebook', notes: null, grade: 'B', single_or_chain: 'สาขาเดียว', created_at: '2026-03-03T16:30:00' },
  { id: '6', clinic_name: 'Radiance Center', company_name: 'Radiance Medical', address: 'ราชดำริ, กรุงเทพฯ', tax_id: null, entity_type: 'โรงพยาบาล', branch_type: 'สำนักงานใหญ่', phone: '02-555-6666', email: 'info@radiance.co.th', customer_status: 'DORMANT', assigned_sale: 'FORD', lead_source: 'แนะนำ', notes: 'เคยซื้อ Ultraformer แต่หยุดใช้', grade: 'C', single_or_chain: 'สาขาเดียว', created_at: '2026-01-15T08:00:00' },
  { id: '7', clinic_name: 'Beauty First', company_name: 'BF Clinic Co., Ltd.', address: 'เซ็นทรัลเวิลด์, กรุงเทพฯ', tax_id: null, entity_type: 'นิติบุคคล', branch_type: 'สาขา', phone: '02-777-8888', email: 'bf@beautyfirst.co.th', customer_status: 'PURCHASED', assigned_sale: 'PETCH', lead_source: 'งานแสดงสินค้า', notes: null, grade: 'A', single_or_chain: 'เชน', created_at: '2026-02-20T13:00:00' },
  { id: '8', clinic_name: 'Nova Skin Clinic', company_name: null, address: 'ขอนแก่น', tax_id: null, entity_type: 'คลินิก', branch_type: null, phone: '043-222-111', email: null, customer_status: 'DEMO_DONE', assigned_sale: 'VARN', lead_source: 'เว็บไซต์', notes: 'รอผลตัดสินใจ', grade: 'B', single_or_chain: 'สาขาเดียว', created_at: '2026-03-01T10:30:00' },
  { id: '9', clinic_name: 'Zen Clinic', company_name: null, address: 'เอกมัย, กรุงเทพฯ', tax_id: null, entity_type: 'คลินิก', branch_type: null, phone: '02-444-5555', email: 'zen@email.com', customer_status: 'NEW_LEAD', assigned_sale: 'FAH', lead_source: 'Instagram', notes: null, grade: 'B', single_or_chain: 'สาขาเดียว', created_at: '2026-03-04T09:00:00' },
  { id: '10', clinic_name: 'Luxe Dermatology', company_name: 'Luxe Med Co., Ltd.', address: 'สีลม, กรุงเทพฯ', tax_id: null, entity_type: 'นิติบุคคล', branch_type: 'สำนักงานใหญ่', phone: '02-666-7777', email: 'info@luxe.co.th', customer_status: 'CONTACTED', assigned_sale: 'VI', lead_source: 'งานแสดงสินค้า', notes: null, grade: 'A', single_or_chain: 'เชน', created_at: '2026-02-18T14:00:00' },
];

const mockContacts: Contact[] = [
  { id: 'c1', account_id: '1', name: 'นพ. Big', role: 'Medical Director', phone: '081-111-2222', email: 'big@clarity.co.th' },
  { id: 'c2', account_id: '2', name: 'พญ. สมศรี', role: 'Owner', phone: '089-333-4444', email: 'somsri@aura.co.th' },
  { id: 'c3', account_id: '3', name: 'คุณมานี', role: 'Clinic Manager', phone: '086-555-6666', email: null },
  { id: 'c4', account_id: '4', name: 'นพ. วิชัย', role: 'Owner', phone: '082-777-8888', email: 'wichai@skinlab.co.th' },
  { id: 'c5', account_id: '5', name: 'พญ. แก้ว', role: 'Doctor', phone: '087-999-0000', email: null },
  { id: 'c6', account_id: '6', name: 'คุณสมชาย', role: 'Manager', phone: '081-444-5555', email: 'somchai@radiance.co.th' },
  { id: 'c7', account_id: '7', name: 'คุณลิลลี่', role: 'Owner', phone: '085-222-3333', email: 'lily@beautyfirst.co.th' },
  { id: 'c8', account_id: '8', name: 'พญ. นภา', role: 'Doctor', phone: '088-666-7777', email: null },
];

const FOLLOW_UP_DAYS = 7;

function isFollowUp(account: Account): boolean {
  const diff = Math.floor((Date.now() - new Date(account.created_at).getTime()) / 86400000);
  return diff >= FOLLOW_UP_DAYS && account.customer_status !== 'PURCHASED' && account.customer_status !== 'DORMANT';
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'PROSPECT', label: 'ยังไม่ซื้อ' },
  { value: 'FOLLOW_UP', label: 'ต้องติดตาม' },
  { value: 'PURCHASED', label: 'ซื้อแล้ว' },
  { value: 'DORMANT', label: 'ไม่เคลื่อนไหว' },
];

const ENTITY_TYPES = ['บุคคลธรรมดา', 'นิติบุคคล', 'คลินิก', 'โรงพยาบาล'];
const BRANCH_TYPES = ['สำนักงานใหญ่', 'สาขา'];

const emptyForm: Partial<Account> = {
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

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'วันนี้';
  return `${diff} วัน`;
}

export default function LeadsPage() {
  const { currentUser } = useMockAuth();
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Admin sees all, sales see only their own
  const isAdmin = currentUser?.role === 'ADMIN';
  const myAccounts = isAdmin ? accounts : accounts.filter(a => a.assigned_sale === currentUser?.name);

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
      setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...form } as Account : a));
      toast.success('อัปเดตลูกค้าสำเร็จ');
    } else {
      const newAccount: Account = {
        ...emptyForm,
        ...form,
        assigned_sale: currentUser?.name || form.assigned_sale,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      } as Account;
      setAccounts(prev => [newAccount, ...prev]);
      toast.success('เพิ่มลูกค้าสำเร็จ');
    }
    closeDialog();
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const filtered = myAccounts.filter(a => {
    let matchStatus = true;
    if (statusFilter === 'PROSPECT') {
      matchStatus = !isFollowUp(a) && a.customer_status !== 'PURCHASED' && a.customer_status !== 'DORMANT';
    } else if (statusFilter === 'FOLLOW_UP') {
      matchStatus = isFollowUp(a);
    } else if (statusFilter !== 'ALL') {
      matchStatus = a.customer_status === statusFilter;
    }
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.clinic_name.toLowerCase().includes(q) ||
      (a.company_name || '').toLowerCase().includes(q) ||
      (a.address || '').toLowerCase().includes(q) ||
      (a.assigned_sale || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} ราย จากทั้งหมด {myAccounts.length} ราย</p>
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
              const primaryContact = mockContacts.find(c => c.account_id === account.id);
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
              <Select value={form.assigned_sale || ''} onValueChange={v => updateField('assigned_sale', v)}>
                <SelectTrigger><SelectValue placeholder="เลือกเซลล์" /></SelectTrigger>
                <SelectContent>
                  {MOCK_SALES.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
            <Button onClick={handleSubmit}>
              {editingAccount ? 'บันทึก' : 'เพิ่มลูกค้า'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

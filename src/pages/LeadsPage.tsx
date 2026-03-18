import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, Building2, Star, X } from 'lucide-react';
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
import { useMockAuth, useCanSeeAll, MOCK_SALES } from '@/hooks/useMockAuth';
import { supabase } from '@/integrations/supabase/client';
import QuickNoteButtons from '@/components/ui/QuickNoteButtons';

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
  current_devices: string | null;
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

const FOLLOW_UP_DAYS = 7;

function isFollowUp(account: Account): boolean {
  const diff = Math.floor((Date.now() - new Date(account.created_at).getTime()) / 86400000);
  return diff >= FOLLOW_UP_DAYS && account.customer_status !== 'PURCHASED' && account.customer_status !== 'DORMANT';
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'NEW_LEAD', label: 'ลูกค้าใหม่' },
  { value: 'PROSPECT', label: 'ยังไม่ซื้อ' },
  { value: 'PURCHASED', label: 'ซื้อแล้ว' },
  { value: 'DORMANT', label: 'ไม่เคลื่อนไหว' },
];

const ENTITY_TYPES = ['บุคคลธรรมดา', 'นิติบุคคล', 'คลินิก', 'โรงพยาบาล'];
const BRANCH_TYPES = ['สำนักงานใหญ่', 'สาขา'];
const LEAD_SOURCE_OPTIONS = ['เพื่อนแนะนำ', 'Social media', 'งานแสดงสินค้า'];

const emptyForm = {
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
  current_devices: '',
  // Contact fields (required for new accounts)
  contact_name: '',
  contact_role: '',
  contact_phone: '',
  contact_email: '',
  custom_lead_source: '',
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? 0 : star)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            size={24}
            className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  );
}

function daysSince(dateStr: string | null): string {
  if (!dateStr) return '-';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'วันนี้';
  return `${diff} วัน`;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const { currentUser } = useMockAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<{ id: string; product_name: string }[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [saleFilter, setSaleFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  // Fetch accounts, contacts, and products from database
  const fetchData = async () => {
    setLoading(true);
    const [accRes, conRes, prodRes] = await Promise.all([
      supabase.from('accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('contacts').select('id, account_id, name, role, phone, email'),
      supabase.from('products').select('id, product_name').eq('category', 'DEVICE'),
    ]);
    if (accRes.data) setAccounts(accRes.data as unknown as Account[]);
    if (conRes.data) setContacts(conRes.data as unknown as Contact[]);
    if (prodRes.data) setProducts(prodRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
    const isCustomSource = account.lead_source && !LEAD_SOURCE_OPTIONS.includes(account.lead_source);
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
      lead_source: isCustomSource ? 'OTHER' : (account.lead_source || ''),
      notes: account.notes || '',
      grade: account.grade || '',
      single_or_chain: account.single_or_chain || '',
      current_devices: account.current_devices || '',
      contact_name: '',
      contact_role: '',
      contact_phone: '',
      contact_email: '',
      custom_lead_source: isCustomSource ? account.lead_source! : '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.clinic_name?.trim()) {
      toast.error('กรุณากรอกชื่อคลินิก');
      return;
    }
    if (!editingAccount && !form.contact_name?.trim()) {
      toast.error('กรุณากรอกชื่อผู้ติดต่อ');
      return;
    }

    const resolvedLeadSource = form.lead_source === 'OTHER' ? (form.custom_lead_source || null) : (form.lead_source || null);

    const payload = {
      clinic_name: form.clinic_name!.trim(),
      company_name: form.company_name || null,
      address: form.address || null,
      tax_id: form.tax_id || null,
      entity_type: form.entity_type || null,
      branch_type: form.branch_type || null,
      phone: form.phone || null,
      email: form.email || null,
      customer_status: form.customer_status || 'NEW_LEAD',
      assigned_sale: form.assigned_sale || currentUser?.name || null,
      lead_source: resolvedLeadSource,
      notes: form.notes || null,
      grade: form.grade || null,
      single_or_chain: form.single_or_chain || null,
      current_devices: form.current_devices.trim() || null,
    };

    if (editingAccount) {
      const { error } = await supabase.from('accounts').update(payload).eq('id', editingAccount.id);
      if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
      toast.success('อัปเดตลูกค้าสำเร็จ');
    } else {
      const { data: newAcc, error } = await supabase.from('accounts').insert(payload).select('id').single();
      if (error || !newAcc) { toast.error('เพิ่มลูกค้าไม่สำเร็จ'); return; }
      // Insert contact
      const { error: conErr } = await supabase.from('contacts').insert({
        account_id: newAcc.id,
        name: form.contact_name!.trim(),
        role: form.contact_role || null,
        phone: form.contact_phone || null,
        email: form.contact_email || null,
      });
      if (conErr) { toast.error('เพิ่มลูกค้าสำเร็จ แต่เพิ่มผู้ติดต่อไม่สำเร็จ'); }
      else { toast.success('เพิ่มลูกค้าและผู้ติดต่อสำเร็จ'); }
    }
    closeDialog();
    fetchData();
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const filtered = myAccounts.filter(a => {
    let matchStatus = true;
    if (statusFilter === 'NEW_LEAD') {
      matchStatus = a.customer_status === 'NEW_LEAD';
    } else if (statusFilter === 'PROSPECT') {
      matchStatus = !isFollowUp(a) && a.customer_status !== 'PURCHASED' && a.customer_status !== 'DORMANT' && a.customer_status !== 'NEW_LEAD';
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
    const matchSale = saleFilter === 'ALL' || a.assigned_sale === saleFilter;
    const matchGrade = gradeFilter === 'ALL' || a.grade === gradeFilter;
    return matchStatus && matchSearch && matchSale && matchGrade;
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
          {isAdmin && (
            <Select value={saleFilter} onValueChange={setSaleFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="เซลล์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">เซลล์ทั้งหมด</SelectItem>
                {MOCK_SALES.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="เกรดทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">เกรดทั้งหมด</SelectItem>
              <SelectItem value="A">⭐⭐⭐ A</SelectItem>
              <SelectItem value="B">⭐⭐ B</SelectItem>
              <SelectItem value="C">⭐ C</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">คลินิก / ผู้ติดต่อ</TableHead>
              <TableHead className="hidden md:table-cell">สถานะ</TableHead>
              <TableHead className="hidden sm:table-cell">เซลล์</TableHead>
              <TableHead className="hidden lg:table-cell">เกรด</TableHead>
              <TableHead className="hidden lg:table-cell">เครื่องที่มีอยู่</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : filtered.map(account => {
              const primaryContact = contacts.find(c => c.account_id === account.id);
              const stars = account.grade === 'A' ? 3 : account.grade === 'B' ? 2 : account.grade === 'C' ? 1 : 0;
              return (
                <TableRow
                  key={account.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/leads/${account.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                          <span className="md:hidden"><StatusBadge status={account.customer_status} /></span>
                        </div>
                        {primaryContact && (
                          <p className="text-xs text-muted-foreground truncate">
                            {primaryContact.name}{primaryContact.role ? ` · ${primaryContact.role}` : ''}{primaryContact.phone ? ` · ${primaryContact.phone}` : ''}
                          </p>
                        )}
                        {account.address && (
                          <p className="text-xs text-muted-foreground/60 truncate max-w-[250px]">{account.address}</p>
                        )}
                        {/* Mobile-only: show sale & grade inline */}
                        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                          {account.assigned_sale && <span className="text-xs text-muted-foreground">{account.assigned_sale}</span>}
                          {stars > 0 && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(s => (
                                <Star key={s} size={10} className={s <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground/30'} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={account.customer_status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-foreground">{account.assigned_sale || '-'}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {stars > 0 ? (
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(s => (
                          <Star key={s} size={14} className={s <= stars ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted-foreground/30'} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{account.current_devices || '-'}</span>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
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
            {/* ชื่อคลินิก / บริษัท */}
            <div className="space-y-1.5">
              <Label>ชื่อคลินิก *</Label>
              <Input value={form.clinic_name || ''} onChange={e => updateField('clinic_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ชื่อบริษัท</Label>
              <Input value={form.company_name || ''} onChange={e => updateField('company_name', e.target.value)} />
            </div>

            {/* ผู้ติดต่อหลัก - ย้ายมาอยู่ใต้ชื่อคลินิก/บริษัท */}
            {!editingAccount && (
              <div className="sm:col-span-2 space-y-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                <p className="text-sm font-medium text-foreground">ผู้ติดต่อหลัก <span className="text-destructive">*</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>ชื่อผู้ติดต่อ <span className="text-destructive">*</span></Label>
                    <Input value={form.contact_name} onChange={e => updateField('contact_name', e.target.value)} placeholder="เช่น นพ. สมชาย" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ตำแหน่ง / บทบาท</Label>
                    <Input value={form.contact_role} onChange={e => updateField('contact_role', e.target.value)} placeholder="เช่น Owner, Doctor" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>เบอร์โทรผู้ติดต่อ</Label>
                    <Input value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)} placeholder="08x-xxx-xxxx" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>อีเมลผู้ติดต่อ</Label>
                    <Input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} placeholder="email@example.com" />
                  </div>
                </div>
              </div>
            )}

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
              <Label>โทรศัพท์คลินิก</Label>
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
                  {STATUS_OPTIONS.filter(s => s.value !== 'ALL' && s.value !== 'FOLLOW_UP').map(s => (
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

            {/* แหล่งที่มา - Dropdown with custom option */}
            <div className="space-y-1.5">
              <Label>แหล่งที่มา</Label>
              <Select value={form.lead_source || ''} onValueChange={v => updateField('lead_source', v)}>
                <SelectTrigger><SelectValue placeholder="เลือกแหล่งที่มา" /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  <SelectItem value="OTHER">อื่นๆ (ระบุเอง)</SelectItem>
                </SelectContent>
              </Select>
              {form.lead_source === 'OTHER' && (
                <Input
                  className="mt-1.5"
                  value={form.custom_lead_source}
                  onChange={e => updateField('custom_lead_source', e.target.value)}
                  placeholder="ระบุแหล่งที่มา..."
                />
              )}
            </div>

            {/* เกรด - Star Rating */}
            <div className="space-y-1.5">
              <Label>เกรด</Label>
              <StarRating
                value={form.grade === 'A' ? 3 : form.grade === 'B' ? 2 : form.grade === 'C' ? 1 : 0}
                onChange={v => updateField('grade', v === 3 ? 'A' : v === 2 ? 'B' : v === 1 ? 'C' : '')}
              />
            </div>

            {/* เครื่องที่มีอยู่แล้ว - Text with quick notes */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>เครื่องที่มีอยู่แล้ว</Label>
              <Textarea
                value={form.current_devices}
                onChange={e => updateField('current_devices', e.target.value)}
                rows={2}
                placeholder="พิมพ์ชื่อเครื่องที่ลูกค้ามีอยู่..."
              />
              <QuickNoteButtons
                value={form.current_devices}
                onChange={v => updateField('current_devices', v)}
                storageKey="quick_notes_devices"
                defaults={['Doublo Gold', 'Ultraformer III', 'HIFU เก่า', 'Thermage FLX']}
              />
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

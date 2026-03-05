import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [accRes, conRes] = await Promise.all([
      supabase.from('accounts').select('*').order('clinic_name'),
      supabase.from('contacts').select('id, account_id, name, role, phone, email'),
    ]);
    if (accRes.data) setAccounts(accRes.data as unknown as Account[]);
    if (conRes.data) setContacts(conRes.data as unknown as Contact[]);
    setLoading(false);
  };

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
      lead_source: account.lead_source || '',
      notes: account.notes || '',
      grade: account.grade || '',
      single_or_chain: account.single_or_chain || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.clinic_name?.trim()) {
      toast.error('กรุณากรอกชื่อคลินิก');
      return;
    }
    const payload = {
      clinic_name: form.clinic_name!,
      company_name: form.company_name || null,
      address: form.address || null,
      tax_id: form.tax_id || null,
      entity_type: form.entity_type || null,
      branch_type: form.branch_type || null,
      phone: form.phone || null,
      email: form.email || null,
      lead_source: form.lead_source || null,
      notes: form.notes || null,
      grade: form.grade || null,
      single_or_chain: form.single_or_chain || null,
    };

    if (editingAccount) {
      const { error } = await supabase.from('accounts').update(payload).eq('id', editingAccount.id);
      if (error) { toast.error('อัปเดตไม่สำเร็จ'); return; }
      toast.success('อัปเดตลูกค้าสำเร็จ');
    } else {
      const { error } = await supabase.from('accounts').insert(payload);
      if (error) { toast.error('เพิ่มไม่สำเร็จ'); return; }
      toast.success('เพิ่มลูกค้าสำเร็จ');
    }
    closeDialog();
    fetchData();
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    return !q ||
      a.clinic_name.toLowerCase().includes(q) ||
      (a.company_name || '').toLowerCase().includes(q) ||
      (a.address || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q);
  });

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
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus size={14} /> เพิ่มลูกค้า
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">คลินิก</TableHead>
                <TableHead>ผู้ติดต่อ</TableHead>
                <TableHead>โทรศัพท์</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>เกรด</TableHead>
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
                    onClick={() => navigate(`/leads/${account.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{account.clinic_name}</p>
                          {account.address && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{account.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {primaryContact ? (
                        <div>
                          <p className="text-sm text-foreground">{primaryContact.name}</p>
                          {primaryContact.role && (
                            <p className="text-xs text-muted-foreground">{primaryContact.role}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{account.phone || primaryContact?.phone || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{account.entity_type || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{account.grade || '-'}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">{daysSince(account.created_at)}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    ไม่พบลูกค้า
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
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

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth, type Position } from '@/hooks/useMockAuth';

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'OWNER', label: 'เจ้าของบริษัท' },
  { value: 'SALES_MANAGER', label: 'หัวหน้าเซลล์' },
  { value: 'SALES', label: 'เซลล์' },
  { value: 'PRODUCT', label: 'โปรดัก' },
  { value: 'SERVICE', label: 'เซอร์วิส' },
  { value: 'FINANCE', label: 'บัญชี' },
];

const ROLES: { value: string; label: string }[] = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'USER', label: 'USER' },
];

interface UserForm {
  name: string;
  username: string;
  password: string;
  role: string;
  position: string;
}

const emptyForm: UserForm = { name: '', username: '', password: '', role: 'SALE', position: 'SALES' };

export default function UserManagement() {
  const { allUsers, refreshUsers } = useMockAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: typeof allUsers[0]) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      position: user.position,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.username || !form.password) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('mock_users')
          .update({
            name: form.name.toUpperCase(),
            username: form.username.toLowerCase(),
            password: form.password,
            role: form.role,
            position: form.position,
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('อัปเดต user สำเร็จ');
      } else {
        const { error } = await supabase
          .from('mock_users')
          .insert({
            name: form.name.toUpperCase(),
            username: form.username.toLowerCase(),
            password: form.password,
            role: form.role,
            position: form.position,
          });
        if (error) throw error;
        toast.success('เพิ่ม user สำเร็จ');
      }
      await refreshUsers();
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ยืนยันลบ user "${name}" ?`)) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from('mock_users').delete().eq('id', id);
      if (error) throw error;
      toast.success(`ลบ ${name} สำเร็จ`);
      await refreshUsers();
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setDeleting(null);
    }
  };

  const positionLabel = (pos: string) => POSITIONS.find(p => p.value === pos)?.label || pos;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={16} />
                จัดการผู้ใช้งาน
              </CardTitle>
              <CardDescription>เพิ่ม ลบ แก้ไข ข้อมูลผู้ใช้และตำแหน่ง</CardDescription>
            </div>
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus size={14} />
              เพิ่ม User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{user.password}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{positionLabel(user.position)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deleting === user.id}
                        >
                          {deleting === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'แก้ไข User' : 'เพิ่ม User ใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>ชื่อ</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น FORD" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="เช่น ford" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="เช่น ford1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ตำแหน่ง</Label>
                <Select value={form.position} onValueChange={v => setForm(f => ({ ...f, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
              {editingId ? 'บันทึก' : 'เพิ่ม'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

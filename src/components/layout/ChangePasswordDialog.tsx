import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const { currentUser, refreshUsers } = useMockAuth();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    if (currentPw !== currentUser.password) {
      toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      return;
    }
    if (newPw.length < 4) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mock_users')
        .update({ password: newPw })
        .eq('id', currentUser.id);
      if (error) throw error;
      await refreshUsers();
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>รหัสผ่านปัจจุบัน</Label>
            <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>รหัสผ่านใหม่</Label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

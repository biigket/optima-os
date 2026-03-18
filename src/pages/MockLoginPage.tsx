import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMockAuth } from '@/hooks/useMockAuth';

export default function MockLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, allUsers } = useMockAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      if (ok) {
        toast.success('เข้าสู่ระบบสำเร็จ');
      } else {
        toast.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">
            OPTIMA<span className="text-accent"> OS</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">ชื่อผู้ใช้</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="เช่น ford"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            เข้าสู่ระบบ
          </Button>
        </form>

        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">บัญชีทดสอบ</p>
          <div className="space-y-1">
            {allUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{u.name}</span>
                <span>{u.username} / {u.password}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

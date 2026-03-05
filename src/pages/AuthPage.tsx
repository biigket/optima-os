import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยัน');
      }
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">
            OPTIMA<span className="text-accent"> OS</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name">ชื่อ</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
            {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-accent hover:underline font-medium">
            {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </p>
      </div>
    </div>
  );
}

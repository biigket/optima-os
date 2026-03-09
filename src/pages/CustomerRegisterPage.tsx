import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CustomerRegisterPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    clinic_name: "",
    contact_name: "",
    phone: "",
    email: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clinic_name.trim() || !form.contact_name.trim() || !form.phone.trim()) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", description: "ชื่อคลินิก, ชื่อผู้ติดต่อ และเบอร์โทร เป็นข้อมูลจำเป็น", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Insert account
      const { data: account, error: accErr } = await supabase
        .from("accounts")
        .insert({
          clinic_name: form.clinic_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          customer_status: "NEW_LEAD",
          lead_source: "REGISTER_FORM",
        })
        .select("id")
        .single();

      if (accErr) throw accErr;

      // Insert contact
      const { error: conErr } = await supabase.from("contacts").insert({
        account_id: account.id,
        name: form.contact_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        is_decision_maker: true,
      });

      if (conErr) throw conErr;

      setSuccess(true);
    } catch (err: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center shadow-xl border-0">
          <CardContent className="pt-10 pb-10 space-y-4">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">ลงทะเบียนสำเร็จ!</h2>
            <p className="text-muted-foreground">ขอบคุณที่ลงทะเบียน ทีมงานจะติดต่อกลับโดยเร็ว</p>
            <Button onClick={() => { setSuccess(false); setForm({ clinic_name: "", contact_name: "", phone: "", email: "" }); }} variant="outline" className="mt-4">
              ลงทะเบียนเพิ่ม
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-2">
          <img src="/images/optima-logo.png" alt="Optima" className="h-10 mx-auto" />
          <CardTitle className="text-xl">ลงทะเบียนลูกค้า</CardTitle>
          <CardDescription>กรุณากรอกข้อมูลเพื่อให้ทีมงานติดต่อกลับ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clinic_name">ชื่อคลินิก / บริษัท *</Label>
              <Input id="clinic_name" name="clinic_name" value={form.clinic_name} onChange={handleChange} placeholder="เช่น คลินิกสุขภาพดี" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">ชื่อผู้ติดต่อ *</Label>
              <Input id="contact_name" name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="08x-xxx-xxxx" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@email.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> กำลังบันทึก...</> : "ลงทะเบียน"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Building2, CheckCircle2, ArrowRight, Camera, Navigation, CalendarClock, SwitchCamera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface VisitPlan {
  id: string;
  plan_date: string;
  account_id: string;
  visit_type: string;
  status: string;
  notes?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  accounts?: { id: string; clinic_name: string } | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

export default function VisitCheckinPage() {
  const [plans, setPlans] = useState<VisitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinPlan, setCheckinPlan] = useState<VisitPlan | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Reschedule state
  const [reschedulePlan, setReschedulePlan] = useState<VisitPlan | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('09:00');
  const [rescheduleEnd, setRescheduleEnd] = useState('10:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => { fetchPlans(); }, []);

  async function fetchPlans() {
    setLoading(true);
    const { data } = await supabase
      .from('visit_plans')
      .select('*, accounts(id, clinic_name)')
      .eq('plan_date', today)
      .order('created_at');
    
    if (data) {
      // Fetch primary contacts for each account
      const accountIds = [...new Set((data as any[]).map(d => d.account_id))];
      const { data: contacts } = await supabase
        .from('contacts')
        .select('account_id, name, phone')
        .in('account_id', accountIds)
        .eq('is_decision_maker', true);
      
      const contactMap = new Map<string, { name: string; phone: string | null }>();
      contacts?.forEach(c => {
        if (!contactMap.has(c.account_id)) {
          contactMap.set(c.account_id, { name: c.name, phone: c.phone });
        }
      });

      // If no decision maker, get any first contact
      if (accountIds.length > 0) {
        const { data: allContacts } = await supabase
          .from('contacts')
          .select('account_id, name, phone')
          .in('account_id', accountIds);
        allContacts?.forEach(c => {
          if (!contactMap.has(c.account_id)) {
            contactMap.set(c.account_id, { name: c.name, phone: c.phone });
          }
        });
      }

      setPlans((data as any[]).map(d => ({
        ...d,
        contact_name: contactMap.get(d.account_id)?.name || null,
        contact_phone: contactMap.get(d.account_id)?.phone || null,
      })) as VisitPlan[]);
    }
    setLoading(false);
  }

  function openCheckinDialog(plan: VisitPlan) {
    setCheckinPlan(plan);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setLocation(null);
    setCameraActive(false);
  }

  function closeDialog() {
    stopCamera();
    setCheckinPlan(null);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setLocation(null);
  }

  async function startCamera(mode: 'environment' | 'user' = facingMode) {
    // Stop any existing stream first
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setCameraActive(true);

      // Wait for next render so videoRef is mounted, then attach stream
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      toast.error('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  async function switchCamera() {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newMode);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ensure video has valid dimensions
    const vw = video.videoWidth || video.clientWidth || 640;
    const vh = video.videoHeight || video.clientHeight || 480;

    if (vw === 0 || vh === 0) {
      toast.error('กล้องยังไม่พร้อม กรุณารอสักครู่แล้วลองอีกครั้ง');
      return;
    }

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, vw, vh);

    // Stop camera first so stream doesn't interfere
    stopCamera();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (dataUrl && dataUrl.length > 100) {
      setCapturedPhoto(dataUrl);
      canvas.toBlob(blob => {
        if (blob) setCapturedBlob(blob);
      }, 'image/jpeg', 0.85);
    } else {
      toast.error('ถ่ายรูปไม่สำเร็จ กรุณาลองใหม่');
    }
  }

  function retakePhoto() {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    startCamera();
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      toast.error('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('ได้ตำแหน่งแล้ว');
      },
      () => {
        setLocating(false);
        toast.error('ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function handleCheckin() {
    if (!checkinPlan || !capturedBlob || !location) return;
    setSubmitting(true);

    // Upload photo
    const fileName = `checkin_${checkinPlan.id}_${Date.now()}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from('checkin-photos')
      .upload(fileName, capturedBlob, { contentType: 'image/jpeg', upsert: true });

    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      toast.error(`อัพโหลดรูปไม่สำเร็จ: ${uploadErr.message}`);
      setSubmitting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('checkin-photos').getPublicUrl(fileName);
    const photoUrl = urlData.publicUrl;
    const locationStr = `${location.lat},${location.lng}`;

    // Create visit report
    const { data: report, error } = await supabase.from('visit_reports').insert({
      account_id: checkinPlan.account_id,
      clinic_name: checkinPlan.accounts?.clinic_name || '',
      check_in_at: new Date().toISOString(),
      status: 'VISIT_FORM',
      photo: photoUrl,
      location: locationStr,
    }).select('id').maybeSingle();

    if (error || !report) {
      console.error('Visit report insert error:', error);
      toast.error(`เช็คอินไม่สำเร็จ: ${error?.message || 'ไม่สามารถสร้างรายงานได้'}`);
      setSubmitting(false);
      return;
    }

    // Update plan status
    await supabase.from('visit_plans').update({
      status: 'CHECKED_IN',
      visit_report_id: report.id,
    }).eq('id', checkinPlan.id);

    toast.success(`เช็คอินที่ ${checkinPlan.accounts?.clinic_name} แล้ว`);
    setSubmitting(false);
    closeDialog();
    // Navigate to visit report
    navigate(`/visit-reports?plan=${checkinPlan.id}&account=${checkinPlan.account_id}`);
  }

  function goToReport(plan: VisitPlan) {
    navigate(`/visit-reports?plan=${plan.id}&account=${plan.account_id}`);
  }

  function openRescheduleDialog(plan: VisitPlan) {
    setReschedulePlan(plan);
    setRescheduleDate(format(new Date(new Date().getTime() + 86400000), 'yyyy-MM-dd'));
    setRescheduleStart('09:00');
    setRescheduleEnd('10:00');
    setRescheduleReason('');
  }

  async function handleReschedule() {
    if (!reschedulePlan || !rescheduleDate || !rescheduleReason.trim()) return;
    setRescheduleSubmitting(true);
    const { error } = await supabase.from('visit_plans').update({
      plan_date: rescheduleDate,
      start_time: rescheduleStart,
      end_time: rescheduleEnd,
      notes: `[เปลี่ยนแผน] ${rescheduleReason}${reschedulePlan.notes ? `\n${reschedulePlan.notes}` : ''}`,
    }).eq('id', reschedulePlan.id);
    setRescheduleSubmitting(false);
    if (error) { toast.error('เปลี่ยนแผนไม่สำเร็จ'); return; }
    toast.success('เปลี่ยนแผนเยี่ยมแล้ว');
    setReschedulePlan(null);
    fetchPlans();
  }

  const planned = plans.filter(p => p.status === 'PLANNED');
  const checkedIn = plans.filter(p => p.status === 'CHECKED_IN');
  const reported = plans.filter(p => p.status === 'REPORTED');

  const canSubmit = !!capturedPhoto && !!location && !submitting;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">เช็คอินเยี่ยมลูกค้า</h1>
        <p className="text-sm text-muted-foreground">วันนี้ {format(new Date(), 'd MMMM yyyy', { locale: th })}</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin size={40} className="mx-auto mb-2 opacity-40" />
          <p>ไม่มีแผนเยี่ยมวันนี้</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/weekly-plan')}>ไปวางแผน</Button>
        </div>
      ) : (
        <>
          {planned.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">รอเช็คอิน ({planned.length})</h2>
              {planned.map(plan => (
                <div key={plan.id} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    {plan.contact_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <User size={12} />
                        <span>{plan.contact_name}</span>
                        {plan.contact_phone && <span>· {plan.contact_phone}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => openRescheduleDialog(plan)}
                    >
                      <CalendarClock size={14} /> เปลี่ยนแผน
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openCheckinDialog(plan)}
                    >
                      <Camera size={14} /> เช็คอิน
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {checkedIn.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">เช็คอินแล้ว - รอกรอกรายงาน ({checkedIn.length})</h2>
              {checkedIn.map(plan => (
                <div key={plan.id} className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock size={12} /> เช็คอินแล้ว
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => goToReport(plan)}>
                    กรอกรายงาน <ArrowRight size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {reported.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">รายงานแล้ว ({reported.length})</h2>
              {reported.map(plan => (
                <div key={plan.id} className="rounded-lg border bg-card p-4 flex items-center gap-4 opacity-60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{plan.accounts?.clinic_name}</p>
                    </div>
                    <Badge className="text-[10px] mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">รายงานแล้ว</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Check-in Dialog */}
      <Dialog open={!!checkinPlan} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera size={18} /> เช็คอิน
            </DialogTitle>
            <DialogDescription>
              {checkinPlan?.accounts?.clinic_name} — ถ่ายรูปจากกล้องและดึงตำแหน่ง GPS
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Camera / Photo */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">📷 ถ่ายรูปหน้าร้าน</label>
              {!capturedPhoto && !cameraActive && (
                <Button variant="outline" className="w-full gap-2" onClick={() => startCamera()}>
                  <Camera size={16} /> เปิดกล้อง
                </Button>
              )}
              {cameraActive && (
                <div className="space-y-2">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className={`w-full rounded-lg border bg-black aspect-[4/3] object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                      autoPlay
                      playsInline
                      muted
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 h-9 w-9 rounded-full opacity-90"
                      onClick={switchCamera}
                    >
                      <SwitchCamera size={18} />
                    </Button>
                  </div>
                  <Button className="w-full gap-2" onClick={capturePhoto}>
                    <Camera size={16} /> ถ่ายรูป
                  </Button>
                </div>
              )}
              {capturedPhoto && (
                <div className="space-y-2">
                  <img src={capturedPhoto} className="w-full rounded-lg border aspect-[4/3] object-cover" alt="check-in photo" />
                  <Button variant="outline" size="sm" className="w-full" onClick={retakePhoto}>
                    ถ่ายใหม่
                  </Button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">📍 ตำแหน่ง GPS</label>
              {!location ? (
                <Button variant="outline" className="w-full gap-2" onClick={captureLocation} disabled={locating}>
                  <Navigation size={16} className={locating ? 'animate-spin' : ''} />
                  {locating ? 'กำลังหาตำแหน่ง...' : 'ดึงตำแหน่งปัจจุบัน'}
                </Button>
              ) : (
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 size={14} /> ได้ตำแหน่งแล้ว
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              className="w-full gap-2"
              disabled={!canSubmit}
              onClick={handleCheckin}
            >
              {submitting ? 'กำลังเช็คอิน...' : '✅ ยืนยันเช็คอิน'}
            </Button>

            {!capturedPhoto && !location && (
              <p className="text-xs text-muted-foreground text-center">ต้องถ่ายรูปและดึงตำแหน่ง GPS ก่อนเช็คอิน</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!reschedulePlan} onOpenChange={open => { if (!open) setReschedulePlan(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock size={18} /> เปลี่ยนแผนเยี่ยม
            </DialogTitle>
            <DialogDescription>
              {reschedulePlan?.accounts?.clinic_name} — เลือกวันเวลาใหม่และระบุเหตุผล
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>วันที่ใหม่</Label>
              <Input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>เวลาเริ่ม</Label>
                <Input type="time" value={rescheduleStart} onChange={e => setRescheduleStart(e.target.value)} />
              </div>
              <div>
                <Label>เวลาสิ้นสุด</Label>
                <Input type="time" value={rescheduleEnd} onChange={e => setRescheduleEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>เหตุผลที่เปลี่ยนแผน <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="เช่น ลูกค้าติดธุระ, เปลี่ยนวันนัด..."
                value={rescheduleReason}
                onChange={e => setRescheduleReason(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full gap-2"
              disabled={!rescheduleDate || !rescheduleReason.trim() || rescheduleSubmitting}
              onClick={handleReschedule}
            >
              {rescheduleSubmitting ? 'กำลังบันทึก...' : '📅 ยืนยันเปลี่ยนแผน'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

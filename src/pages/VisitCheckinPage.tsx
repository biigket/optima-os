import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Building2, CheckCircle2, ArrowRight, Camera, Navigation, CalendarClock } from 'lucide-react';
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
  accounts?: { id: string; clinic_name: string } | null;
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
    if (data) setPlans(data as unknown as VisitPlan[]);
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

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      toast.error('ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);

    canvas.toBlob(blob => {
      if (blob) setCapturedBlob(blob);
    }, 'image/jpeg', 0.85);

    stopCamera();
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
      .upload(fileName, capturedBlob, { contentType: 'image/jpeg' });

    if (uploadErr) {
      toast.error('อัพโหลดรูปไม่สำเร็จ');
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
      status: 'CHECKED_IN',
      photo: photoUrl,
      location: locationStr,
    }).select('id').single();

    if (error) {
      toast.error('เช็คอินไม่สำเร็จ');
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
                    <Badge variant="outline" className="text-[10px] mt-1">{plan.visit_type === 'NEW' ? 'ลูกค้าใหม่' : 'ลูกค้าเก่า'}</Badge>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => openCheckinDialog(plan)}
                  >
                    <Camera size={14} /> เช็คอิน
                  </Button>
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
                <Button variant="outline" className="w-full gap-2" onClick={startCamera}>
                  <Camera size={16} /> เปิดกล้อง
                </Button>
              )}
              {cameraActive && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg border bg-black aspect-[4/3] object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
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
    </div>
  );
}

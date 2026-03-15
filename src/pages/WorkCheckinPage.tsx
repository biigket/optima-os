import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, MapPin, Clock, LogIn, LogOut, RefreshCw, Home, Building2, Car, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMockAuth } from '@/hooks/useMockAuth';
import { toast } from 'sonner';

type WorkType = 'OFFICE' | 'FIELD' | 'WFH';

const workTypeConfig: Record<WorkType, { label: string; icon: React.ElementType; color: string }> = {
  OFFICE: { label: 'เข้าออฟฟิศ', icon: Building2, color: 'bg-blue-100 text-blue-800' },
  FIELD: { label: 'ออกพื้นที่', icon: Car, color: 'bg-amber-100 text-amber-800' },
  WFH: { label: 'ทำงานที่บ้าน', icon: Home, color: 'bg-emerald-100 text-emerald-800' },
};

interface TodayCheckin {
  id: string;
  work_type: WorkType;
  check_in_at: string;
  check_out_at: string | null;
  check_in_address: string | null;
  check_out_address: string | null;
  check_in_photo: string | null;
  check_out_photo: string | null;
  check_in_note: string | null;
  check_out_note: string | null;
}

export default function WorkCheckinPage() {
  const { currentUser } = useMockAuth();
  const [todayCheckin, setTodayCheckin] = useState<TodayCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workType, setWorkType] = useState<WorkType>('OFFICE');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchToday = useCallback(async () => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('work_checkins')
      .select('*')
      .eq('user_name', currentUser.name)
      .gte('check_in_at', `${today}T00:00:00`)
      .lte('check_in_at', `${today}T23:59:59`)
      .order('check_in_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) setTodayCheckin(data[0] as unknown as TodayCheckin);
    else setTodayCheckin(null);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      // Reverse geocode (simple)
      let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`);
        const geo = await resp.json();
        if (geo.display_name) address = geo.display_name;
      } catch { /* fallback to coords */ }
      setLocation({ lat: latitude, lng: longitude, address });
    } catch (err) {
      toast.error('ไม่สามารถดึงตำแหน่งได้ กรุณาเปิด GPS');
    }
    setGettingLocation(false);
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('ไม่สามารถเปิดกล้องได้');
      setShowCamera(false);
    }
  };

  const switchCamera = async () => {
    stopCamera();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newMode } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('ไม่สามารถสลับกล้องได้');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user' && ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhotoUrl(dataUrl);
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const uploadPhoto = async (dataUrl: string, suffix: string): Promise<string | null> => {
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `${currentUser?.name || 'user'}-${Date.now()}-${suffix}.jpg`;
    const { error } = await supabase.storage.from('work-checkin-photos').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (error) { console.error(error); return null; }
    const { data: urlData } = supabase.storage.from('work-checkin-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleCheckIn = async () => {
    if (!currentUser) return;
    if (workType !== 'WFH' && !location) { toast.error('กรุณาดึงตำแหน่ง GPS ก่อน'); return; }
    if (!photoUrl) { toast.error('กรุณาถ่ายรูปก่อน'); return; }
    setSubmitting(true);
    const uploadedUrl = await uploadPhoto(photoUrl, 'checkin');
    const { error } = await supabase.from('work_checkins').insert({
      user_name: currentUser.name,
      work_type: workType,
      check_in_lat: location?.lat || null,
      check_in_lng: location?.lng || null,
      check_in_address: location?.address || (workType === 'WFH' ? 'WFH' : null),
      check_in_photo: uploadedUrl,
      check_in_note: note || null,
    });
    if (error) { toast.error('เช็คอินไม่สำเร็จ'); console.error(error); }
    else { toast.success('เช็คอินสำเร็จ!'); setPhotoUrl(null); setNote(''); setLocation(null); await fetchToday(); }
    setSubmitting(false);
  };

  const handleCheckOut = async () => {
    if (!todayCheckin) return;
    if (workType !== 'WFH' && !location) { toast.error('กรุณาดึงตำแหน่ง GPS ก่อน'); return; }
    if (!photoUrl) { toast.error('กรุณาถ่ายรูปก่อน'); return; }
    setSubmitting(true);
    const uploadedUrl = await uploadPhoto(photoUrl, 'checkout');
    const { error } = await supabase.from('work_checkins').update({
      check_out_at: new Date().toISOString(),
      check_out_lat: location?.lat || null,
      check_out_lng: location?.lng || null,
      check_out_address: location?.address || (todayCheckin.work_type === 'WFH' ? 'WFH' : null),
      check_out_photo: uploadedUrl,
      check_out_note: note || null,
    }).eq('id', todayCheckin.id);
    if (error) { toast.error('เช็คเอาท์ไม่สำเร็จ'); console.error(error); }
    else { toast.success('เช็คเอาท์สำเร็จ!'); setPhotoUrl(null); setNote(''); setLocation(null); await fetchToday(); }
    setSubmitting(false);
  };

  useEffect(() => { return () => stopCamera(); }, []);

  const isCheckedIn = !!todayCheckin && !todayCheckin.check_out_at;
  const isComplete = !!todayCheckin?.check_out_at;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 max-w-lg mx-auto animate-fade-in">
      {/* Header with time */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">เช็คอินทำงาน</h1>
        <p className="text-4xl font-mono font-bold text-primary">{timeStr}</p>
        <p className="text-sm text-muted-foreground">{dateStr}</p>
        <p className="text-sm font-medium text-foreground">{currentUser?.name} • {currentUser?.department || 'ไม่ระบุแผนก'}</p>
      </div>

      {/* Today's status */}
      {todayCheckin && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">สถานะวันนี้</h3>
            <Badge className={workTypeConfig[todayCheckin.work_type as WorkType]?.color}>
              {workTypeConfig[todayCheckin.work_type as WorkType]?.label}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <LogIn size={14} />
              <span>เข้า: {new Date(todayCheckin.check_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <LogOut size={14} />
              <span>ออก: {todayCheckin.check_out_at ? new Date(todayCheckin.check_out_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
            </div>
          </div>
          {todayCheckin.check_in_address && (
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <MapPin size={12} className="shrink-0 mt-0.5" />
              {todayCheckin.check_in_address}
            </p>
          )}
          {isComplete && (
            <div className="text-center py-2">
              <Badge className="bg-emerald-100 text-emerald-800 text-sm px-4 py-1">✅ เช็คอินครบแล้ววันนี้</Badge>
            </div>
          )}
        </div>
      )}

      {/* Check-in / Check-out form */}
      {!isComplete && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            {isCheckedIn ? '🔴 เช็คเอาท์' : '🟢 เช็คอิน'}
          </h3>

          {/* Work type selector (only for check-in) */}
          {!isCheckedIn && (
            <div>
              <Label className="text-xs text-muted-foreground">ประเภทการทำงาน</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(Object.entries(workTypeConfig) as [WorkType, typeof workTypeConfig[WorkType]][]).map(([key, conf]) => (
                  <button
                    key={key}
                    onClick={() => setWorkType(key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                      workType === key ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    <conf.icon size={20} />
                    {conf.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GPS */}
          {(isCheckedIn ? todayCheckin?.work_type !== 'WFH' : workType !== 'WFH') && (
            <div>
              <Label className="text-xs text-muted-foreground">ตำแหน่ง GPS</Label>
              {location ? (
                <div className="mt-1 p-2 rounded-md bg-emerald-50 text-emerald-800 text-xs flex items-start gap-1.5">
                  <MapPin size={14} className="shrink-0 mt-0.5" />
                  <span>{location.address}</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-1 w-full gap-2" onClick={getLocation} disabled={gettingLocation}>
                  {gettingLocation ? <RefreshCw size={14} className="animate-spin" /> : <MapPin size={14} />}
                  {gettingLocation ? 'กำลังดึงตำแหน่ง...' : 'ดึงตำแหน่ง GPS'}
                </Button>
              )}
            </div>
          )}

          {/* Camera */}
          <div>
            <Label className="text-xs text-muted-foreground">ถ่ายรูป *</Label>
            {photoUrl ? (
              <div className="mt-1 relative">
                <img src={photoUrl} alt="captured" className="w-full rounded-lg" />
                <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => setPhotoUrl(null)}>ถ่ายใหม่</Button>
              </div>
            ) : showCamera ? (
              <div className="mt-1 relative">
                <video ref={videoRef} autoPlay playsInline muted className={`w-full rounded-lg ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  <Button size="sm" variant="outline" onClick={switchCamera} className="gap-1"><SwitchCamera size={14} /></Button>
                  <Button size="sm" onClick={capturePhoto} className="gap-1 px-6"><Camera size={14} /> ถ่าย</Button>
                  <Button size="sm" variant="outline" onClick={() => { stopCamera(); setShowCamera(false); }}>ยกเลิก</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="mt-1 w-full gap-2" onClick={startCamera}>
                <Camera size={14} /> เปิดกล้อง
              </Button>
            )}
          </div>

          {/* Note */}
          <div>
            <Label className="text-xs text-muted-foreground">หมายเหตุ (ไม่บังคับ)</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="mt-1" placeholder="เช่น มีนัดประชุม, ออกพื้นที่เขต..." />
          </div>

          {/* Submit */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={submitting}
          >
            {submitting ? <RefreshCw size={16} className="animate-spin" /> : isCheckedIn ? <LogOut size={16} /> : <LogIn size={16} />}
            {isCheckedIn ? 'เช็คเอาท์' : 'เช็คอิน'}
          </Button>
        </div>
      )}
    </div>
  );
}

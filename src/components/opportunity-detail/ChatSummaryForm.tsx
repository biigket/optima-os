import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Sparkles, Loader2, Send, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatSummaryFormProps {
  opportunityId: string;
  accountId: string;
  clinicName?: string;
  userName: string;
  onSummaryCreated: (summary: string, images: string[]) => void;
}

export default function ChatSummaryForm({ opportunityId, accountId, clinicName, userName, onSummaryCreated }: ChatSummaryFormProps) {
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      const ext = img.file.name.split('.').pop() || 'png';
      const path = `${opportunityId}/chat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('opportunity-files').upload(path, img.file);
      if (error) { console.error('Upload error:', error); continue; }
      const { data: urlData } = supabase.storage.from('opportunity-files').getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSummarize = async () => {
    if (images.length === 0 && !notes.trim()) {
      toast.error('กรุณาอัปโหลดรูปแชทหรือพิมพ์โน้ต');
      return;
    }
    setLoading(true);
    setSummary(null);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
        if (imageUrls.length === 0) {
          toast.error('อัปโหลดรูปไม่สำเร็จ');
          setLoading(false);
          return;
        }
      }

      // Call AI
      const { data, error } = await supabase.functions.invoke('summarize-chat', {
        body: { images: imageUrls, notes: notes.trim() || null, clinicName },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSummary(data.summary);
    } catch (e: any) {
      console.error('Summarize error:', e);
      toast.error(e.message || 'AI สรุปไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!summary) return;

    // Upload images if not already uploaded
    let imageUrls: string[] = [];
    if (images.length > 0) {
      imageUrls = await uploadImages();
    }

    onSummaryCreated(summary, imageUrls);
    // Reset
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setNotes('');
    setSummary(null);
  };

  return (
    <div className="space-y-3">
      {/* Image upload area */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-primary', 'bg-primary/5'); }}
        onDragLeave={e => { e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); }}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-primary', 'bg-primary/5'); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <ImagePlus size={24} className="mx-auto text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">แคปแชท LINE / screenshot จากการคุย</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/80 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      <Textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="โน้ตเพิ่มเติม เช่น ลูกค้าบอกว่า... / สนใจเรื่อง..."
        className="text-sm min-h-[60px] bg-muted/30"
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!summary ? (
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5"
            onClick={handleSummarize}
            disabled={loading || (images.length === 0 && !notes.trim())}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {loading ? 'กำลังวิเคราะห์...' : 'AI สรุปแชท'}
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setSummary(null)}>
              สรุปใหม่
            </Button>
            <Button size="sm" className="text-xs h-8 gap-1" onClick={handleSave}>
              <Send size={12} /> บันทึกลง History
            </Button>
          </>
        )}
      </div>

      {/* Editable summary result */}
      {summary && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary">AI สรุปแชท</span>
            <span className="text-[10px] text-muted-foreground">(แก้ไขได้ก่อนบันทึก)</span>
          </div>
          <Textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            className="text-xs min-h-[100px] bg-background/50 border-primary/20 focus:border-primary/40"
          />
        </div>
      )}
    </div>
  );
}

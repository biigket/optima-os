import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Pin, Paperclip, Trash2, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Announcement } from '@/hooks/useDashboardData';

interface Props {
  announcements: Announcement[];
  onRefresh: () => void;
}

const priorityColors: Record<string, string> = {
  HIGH: 'border-l-destructive bg-destructive/5',
  NORMAL: 'border-l-primary bg-card',
  LOW: 'border-l-muted-foreground/30 bg-card',
};

const priorityLabels: Record<string, string> = {
  HIGH: '🔴 ด่วน',
  NORMAL: '🔵 ปกติ',
  LOW: '⚪ ทั่วไป',
};

export default function AnnouncementBoard({ announcements, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileType: string | undefined;
    let fileSize: number | undefined;

    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('announcement-files').upload(path, file);
      if (uploadErr) {
        toast.error('อัปโหลดไฟล์ไม่สำเร็จ');
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('announcement-files').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      content: content.trim(),
      priority,
      file_url: fileUrl,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
    } as any);

    if (error) {
      toast.error('บันทึกประกาศไม่สำเร็จ');
    } else {
      toast.success('เพิ่มประกาศแล้ว');
      setTitle(''); setContent(''); setPriority('NORMAL'); setFile(null);
      setOpen(false);
      onRefresh();
    }
    setSaving(false);
  };

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from('announcements').update({ is_pinned: !current } as any).eq('id', id);
    onRefresh();
  };

  const deleteAnn = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    onRefresh();
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <FileText size={14} />;
    if (type.startsWith('image/')) return <ImageIcon size={14} />;
    return <FileText size={14} />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone size={16} className="text-primary" />
            ประกาศบริษัท
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus size={12} /> เพิ่มประกาศ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>เพิ่มประกาศใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input placeholder="หัวข้อประกาศ" value={title} onChange={e => setTitle(e.target.value)} />
                <Textarea placeholder="รายละเอียด..." value={content} onChange={e => setContent(e.target.value)} className="min-h-[100px]" />
                <div className="flex gap-2">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">🔴 ด่วน</SelectItem>
                      <SelectItem value="NORMAL">🔵 ปกติ</SelectItem>
                      <SelectItem value="LOW">⚪ ทั่วไป</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" className="h-9 text-xs gap-1" onClick={() => fileRef.current?.click()}>
                    <Paperclip size={12} /> {file ? file.name : 'แนบไฟล์'}
                  </Button>
                  <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button onClick={handleSubmit} disabled={saving || !title.trim() || !content.trim()} className="w-full">
                  {saving ? 'กำลังบันทึก...' : 'โพสต์ประกาศ'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {announcements.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">ยังไม่มีประกาศ</p>
        )}
        {announcements.map(ann => (
          <div key={ann.id} className={`rounded-md border border-l-4 p-3 ${priorityColors[ann.priority] || priorityColors.NORMAL}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {ann.is_pinned && <Pin size={12} className="text-primary shrink-0" />}
                  <span className="text-xs font-semibold text-foreground">{ann.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {new Date(ann.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{ann.content}</p>
                {ann.file_url && (
                  <a href={ann.file_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded bg-muted text-xs text-primary hover:underline">
                    {getFileIcon(ann.file_type)}
                    {ann.file_name || 'ไฟล์แนบ'}
                    <Download size={10} />
                  </a>
                )}
              </div>
              <div className="flex gap-0.5 shrink-0">
                <button onClick={() => togglePin(ann.id, ann.is_pinned)} className="p-1 rounded hover:bg-muted" title={ann.is_pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}>
                  <Pin size={12} className={ann.is_pinned ? 'text-primary' : 'text-muted-foreground'} />
                </button>
                <button onClick={() => deleteAnn(ann.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

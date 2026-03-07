import { useState } from 'react';
import { Phone, Users, Building2, Target, Presentation, FileText, ArrowRight, Pin, MoreHorizontal, MessageSquare, Pencil, Trash2, X, Check, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Activity } from '@/types';
import type { OpportunityNote } from '@/pages/OpportunitiesPage';
import StructuredNotes from './StructuredNotes';

const TYPE_ICONS: Record<string, React.ElementType> = {
  CALL: Phone, MEETING: Users, TASK: Building2, DEADLINE: Target, DEMO: Presentation,
};

const TYPE_COLORS: Record<string, string> = {
  CALL: 'text-blue-600 bg-blue-50', MEETING: 'text-violet-600 bg-violet-50',
  TASK: 'text-emerald-600 bg-emerald-50', DEADLINE: 'text-red-600 bg-red-50',
  DEMO: 'text-orange-600 bg-orange-50',
};

interface StageChange {
  from: string;
  to: string;
  date: string;
}

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'Lead Qualified', CONTACTED: 'นัดพบ/Need', DEMO_SCHEDULED: 'Demo/Workshop',
  DEMO_DONE: 'Proposal Sent', NEGOTIATION: 'Negotiation', WON: 'Won', LOST: 'Lost/Nurture',
};

interface HistoryTimelineProps {
  activities: Activity[];
  stageHistory: StageChange[];
  notes: OpportunityNote[];
  onUpdateNote?: (id: string, content: string) => void;
  onDeleteNote?: (id: string) => void;
  onPinNote?: (id: string) => void;
  onDeleteActivity?: (id: string) => void;
  onUpdateActivity?: (activity: Activity) => void;
  onAddComment?: (parentId: string, comment: string) => void;
  pinnedIds?: Set<string>;
  clinicName?: string;
}

type TimelineItem = {
  type: 'activity' | 'stage' | 'note';
  date: string;
  data: any;
};

export default function HistoryTimeline({ activities, stageHistory, notes, onUpdateNote, onDeleteNote, onPinNote, onDeleteActivity, onUpdateActivity, onAddComment, pinnedIds, clinicName }: HistoryTimelineProps) {
  const [filter, setFilter] = useState('all');

  const doneActivities = activities.filter(a => a.is_done);

  // Separate top-level notes from comments (notes with parent_id)
  const topLevelNotes = notes.filter(n => !n.parent_id);
  const commentsByParent = new Map<string, OpportunityNote[]>();
  notes.filter(n => n.parent_id).forEach(n => {
    const list = commentsByParent.get(n.parent_id!) || [];
    list.push(n);
    commentsByParent.set(n.parent_id!, list);
  });

  const items: TimelineItem[] = [];

  if (filter === 'all' || filter === 'activities') {
    doneActivities.forEach(a => items.push({ type: 'activity', date: a.created_at, data: a }));
  }
  if (filter === 'all' || filter === 'changelog') {
    stageHistory.forEach(s => items.push({ type: 'stage', date: s.date, data: s }));
  }
  if (filter === 'all' || filter === 'notes') {
    topLevelNotes.forEach(n => items.push({ type: 'note', date: n.created_at, data: n }));
  }

  // Sort: pinned first, then by date desc
  items.sort((a, b) => {
    const aId = a.data?.id || '';
    const bId = b.data?.id || '';
    const aPinned = pinnedIds?.has(aId) ? 1 : 0;
    const bPinned = pinnedIds?.has(bId) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">History</p>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="activities" className="text-[10px] h-5 px-2">Activities</TabsTrigger>
            <TabsTrigger value="notes" className="text-[10px] h-5 px-2">Notes</TabsTrigger>
            <TabsTrigger value="changelog" className="text-[10px] h-5 px-2">Changelog</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">ยังไม่มีประวัติ</p>
      ) : (
        <div className="relative pl-6 space-y-3">
          <div className="absolute left-[9px] top-2 bottom-2 w-px border-l border-dashed border-border" />

          {items.map((item, idx) => (
            <div key={idx} className="relative">
              {item.type === 'activity' && (
                <ActivityItem
                  data={item.data}
                  clinicName={clinicName}
                  isPinned={pinnedIds?.has(item.data.id)}
                  onDelete={onDeleteActivity}
                  onPin={onPinNote}
                  onUpdate={onUpdateActivity}
                  onAddComment={onAddComment}
                  onUpdateComment={onUpdateNote}
                  onDeleteComment={onDeleteNote}
                  comments={commentsByParent.get(item.data.id) || []}
                />
              )}
              {item.type === 'stage' && <StageItem data={item.data} />}
              {item.type === 'note' && (
                <NoteItem
                  data={item.data}
                  isPinned={pinnedIds?.has(item.data.id)}
                  onUpdate={onUpdateNote}
                  onDelete={onDeleteNote}
                  onPin={onPinNote}
                  onAddComment={onAddComment}
                  onUpdateComment={onUpdateNote}
                  onDeleteComment={onDeleteNote}
                  comments={commentsByParent.get(item.data.id) || []}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentList({ comments, onUpdate, onDelete }: {
  comments: OpportunityNote[];
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  return (
    <div className="mt-1.5 space-y-1">
      {comments.map(c => (
        <div key={c.id} className="ml-3 flex gap-1 text-[10px] text-muted-foreground group/comment">
          <span className="shrink-0 mt-0.5">↳</span>
          <div className="flex-1 min-w-0">
            {editingId === c.id ? (
              <div className="flex gap-1 items-center">
                <input
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="flex-1 text-[10px] h-5 px-1.5 rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                />
                <button onClick={() => { if (editContent.trim()) { onUpdate?.(c.id, editContent.trim()); setEditingId(null); } }} className="p-0.5 rounded hover:bg-muted text-primary">
                  <Check size={10} />
                </button>
                <button onClick={() => setEditingId(null)} className="p-0.5 rounded hover:bg-muted">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  <p className="text-foreground/90">{c.content}</p>
                  <p className="opacity-70">{c.created_by} · {new Date(c.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="hidden group-hover/comment:flex items-center gap-0.5 shrink-0">
                  {onUpdate && (
                    <button onClick={() => { setEditingId(c.id); setEditContent(c.content); }} className="p-0.5 rounded hover:bg-muted" title="Edit">
                      <Pencil size={9} />
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(c.id)} className="p-0.5 rounded hover:bg-muted text-destructive" title="Delete">
                      <Trash2 size={9} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ data, clinicName, isPinned, onDelete, onPin, onUpdate, onAddComment, onUpdateComment, onDeleteComment, comments = [] }: {
  data: Activity; clinicName?: string; isPinned?: boolean;
  onDelete?: (id: string) => void; onPin?: (id: string) => void;
  onUpdate?: (activity: Activity) => void;
  onAddComment?: (parentId: string, comment: string) => void;
  onUpdateComment?: (id: string, content: string) => void;
  onDeleteComment?: (id: string) => void;
  comments?: OpportunityNote[];
}) {
  const Icon = TYPE_ICONS[data.activity_type] || Building2;
  const colors = TYPE_COLORS[data.activity_type] || TYPE_COLORS.TASK;
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(data.title);
  const [editNotes, setEditNotes] = useState(data.notes || '');
  const [saving, setSaving] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    const updates = { title: editTitle.trim(), notes: editNotes.trim() || null };
    const { error } = await supabase.from('activities').update(updates).eq('id', data.id);
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    toast.success('อัปเดตกิจกรรมแล้ว');
    onUpdate?.({ ...data, ...updates });
    setEditing(false);
  };

  return (
    <div className={`flex items-start gap-2 ${isPinned ? 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
      <div className={`absolute -left-6 w-[18px] h-[18px] rounded-full ${colors} flex items-center justify-center mt-0.5`}>
        <Icon size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground flex-1">{data.title}</span>
          
          {data.priority === 'HIGH' && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">HIGH</span>
          )}
          <div className="flex items-center gap-0.5">
            <button onClick={() => onPin?.(data.id)} className={`p-1 rounded hover:bg-muted ${isPinned ? 'text-foreground' : 'text-muted-foreground'}`} title={isPinned ? 'Unpin' : 'Pin'}>
              <Pin size={11} className={isPinned ? 'fill-foreground' : ''} />
            </button>
            <button onClick={() => setShowComment(!showComment)} className="p-1 rounded hover:bg-muted text-muted-foreground" title="Comment">
              <MessageSquare size={11} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <MoreHorizontal size={11} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-[120px]">
                <DropdownMenuItem onClick={() => { setEditing(true); setEditTitle(data.title); setEditNotes(data.notes || ''); }}>
                  <Pencil size={11} className="mr-1.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(data.id)} className="text-destructive">
                  <Trash2 size={11} className="mr-1.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {data.activity_date}{data.start_time ? ` ${data.start_time}` : ''} · {data.activity_type}
        </p>
        {clinicName && (
          <p className="text-[10px] text-muted-foreground">{clinicName}</p>
        )}

        {editing ? (
          <div className="mt-1.5 space-y-1.5 border border-primary/30 rounded-lg p-2 bg-primary/5">
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="h-7 text-xs font-medium"
              autoFocus
            />
            <Textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Notes..."
              className="text-[10px] min-h-[36px] resize-none"
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)} disabled={saving}>
                <X size={10} className="mr-0.5" /> Cancel
              </Button>
              <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSave} disabled={saving || !editTitle.trim()}>
                <Check size={10} className="mr-0.5" /> Save
              </Button>
            </div>
          </div>
        ) : (
          data.notes && (
            <div className="mt-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-2">
              <StructuredNotes content={data.notes} />
            </div>
          )
        )}

        {showComment && (
          <div className="mt-1.5 ml-4 flex gap-1.5">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-[10px] h-6 px-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" className="h-6 text-[10px] px-2" disabled={!comment.trim()} onClick={() => { if (comment.trim()) { onAddComment?.(data.id, comment.trim()); setComment(''); setShowComment(false); } }}>
              Post
            </Button>
          </div>
        )}

        {/* Nested comments */}
        {comments.length > 0 && (
          <CommentList comments={comments} onUpdate={onUpdateComment} onDelete={onDeleteComment} />
        )}
      </div>
    </div>
  );
}
function StageItem({ data }: { data: { from: string; to: string; date: string } }) {
  return (
    <div className="flex items-start gap-2">
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full border-2 border-primary bg-card mt-0.5" />
      <div>
        <div className="flex items-center gap-1 text-xs text-foreground">
          <span className="font-medium">{STAGE_LABELS[data.from] || data.from}</span>
          <ArrowRight size={10} className="text-muted-foreground" />
          <span className="font-medium">{STAGE_LABELS[data.to] || data.to}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {new Date(data.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function NoteItem({ data, isPinned, onUpdate, onDelete, onPin, onAddComment, onUpdateComment, onDeleteComment, comments = [] }: {
  data: OpportunityNote;
  isPinned?: boolean;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onAddComment?: (parentId: string, comment: string) => void;
  onUpdateComment?: (id: string, content: string) => void;
  onDeleteComment?: (id: string) => void;
  comments?: OpportunityNote[];
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onUpdate?.(data.id, editContent.trim());
    setEditing(false);
  };

  return (
    <div className={`flex items-start gap-2 ${isPinned ? 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
      <div className="absolute -left-6 w-[18px] h-[18px] rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 flex items-center justify-center mt-0.5">
        <FileText size={10} />
      </div>
      <div className="flex-1">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 group relative">
          {/* Action buttons - top right */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
            <button
              onClick={() => onPin?.(data.id)}
              className={`p-1 rounded hover:bg-amber-200/50 ${isPinned ? 'text-primary' : 'text-amber-700 dark:text-amber-400'}`}
              title={isPinned ? 'Unpin' : 'Pin this note'}
            >
              <Pin size={11} className={isPinned ? 'fill-primary' : ''} />
            </button>
            <button
              onClick={() => setShowComment(!showComment)}
              className="p-1 rounded hover:bg-amber-200/50 text-amber-700 dark:text-amber-400"
              title="Add a comment"
            >
              <MessageSquare size={11} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-amber-200/50 text-amber-700 dark:text-amber-400">
                  <MoreHorizontal size={11} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs min-w-[120px]">
                <DropdownMenuItem onClick={() => { setEditing(true); setEditContent(data.content); }}>
                  <Pencil size={11} className="mr-1.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(data.id)} className="text-destructive">
                  <Trash2 size={11} className="mr-1.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="text-xs min-h-[40px] bg-transparent border-amber-300 dark:border-amber-700"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditing(false)}>
                  <X size={10} className="mr-0.5" /> Cancel
                </Button>
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={handleSaveEdit}>
                  <Check size={10} className="mr-0.5" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              {data.file_url ? (
                <div className="space-y-2 mt-0.5">
                  {data.file_type?.startsWith('image/') && (
                    <a href={data.file_url} target="_blank" rel="noopener noreferrer" className="block w-1/3">
                      <img
                        src={data.file_url}
                        alt={data.file_name || 'preview'}
                        className="rounded-lg border border-blue-200 dark:border-blue-800 object-cover w-full"
                      />
                    </a>
                  )}
                  <div className="flex items-center gap-2.5 p-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/30">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={data.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-foreground hover:underline truncate block">
                        {data.file_name || data.content}
                      </a>
                      {data.file_size && (
                        <p className="text-[10px] text-muted-foreground">{(data.file_size / 1024).toFixed(0)} KB · {data.file_type || 'file'}</p>
                      )}
                    </div>
                    <a href={data.file_url} download target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 shrink-0">
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <StructuredNotes content={data.content} className="pr-16" />
              )}
            </>
          )}
        </div>

        {/* Comment input */}
        {showComment && (
          <div className="mt-1.5 ml-4 flex gap-1.5">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-[10px] h-6 px-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button size="sm" className="h-6 text-[10px] px-2" disabled={!comment.trim()} onClick={() => { if (comment.trim()) { onAddComment?.(data.id, comment.trim()); setComment(''); setShowComment(false); } }}>
              Post
            </Button>
          </div>
        )}

        {/* Nested comments */}
        {comments.length > 0 && (
          <CommentList comments={comments} onUpdate={onUpdateComment} onDelete={onDeleteComment} />
        )}

        <p className="text-[10px] text-muted-foreground mt-1">
          {data.created_by} · {new Date(data.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

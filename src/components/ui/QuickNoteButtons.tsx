import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface QuickNoteButtonsProps {
  value: string;
  onChange: (value: string) => void;
  storageKey: string;
  defaults: string[];
}

export default function QuickNoteButtons({ value, onChange, storageKey, defaults }: QuickNoteButtonsProps) {
  const [tags, setTags] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaults;
    } catch { return defaults; }
  });
  const [newTag, setNewTag] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tags));
  }, [tags, storageKey]);

  const isInText = (tag: string) => value.includes(tag);

  const toggleTag = (tag: string) => {
    if (isInText(tag)) {
      const updated = value
        .replace(new RegExp(`,?\\s*${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`), match => {
          if (match.startsWith(',') && match.endsWith(',')) return ',';
          return '';
        })
        .replace(/^[,\s]+|[,\s]+$/g, '')
        .replace(/,\s*,/g, ', ');
      onChange(updated);
    } else {
      const current = value.trim();
      onChange(current ? `${current}, ${tag}` : tag);
    }
  };

  const addTag = () => {
    const t = newTag.trim();
    if (!t || tags.includes(t)) return;
    setTags(prev => [...prev, t]);
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(x => x !== tag));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <div key={tag} className="inline-flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                isInText(tag)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-input hover:bg-muted/50'
              }`}
            >
              {isInText(tag) ? `✕ ${tag}` : `+ ${tag}`}
            </button>
            {editing && (
              <button type="button" onClick={() => removeTag(tag)} className="p-0.5 rounded hover:bg-destructive/10 text-destructive">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="px-2 py-1 rounded-md text-xs font-medium border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          {editing ? 'เสร็จ' : '⚙ จัดการ'}
        </button>
      </div>
      {editing && (
        <div className="flex gap-1.5">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="h-8 text-xs flex-1"
            placeholder="เพิ่มตัวเลือกใหม่..."
          />
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs px-3" onClick={addTag} disabled={!newTag.trim()}>
            <Plus size={12} /> เพิ่ม
          </Button>
        </div>
      )}
    </div>
  );
}

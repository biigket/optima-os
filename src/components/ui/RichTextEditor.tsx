import { useEffect, useMemo, useRef, useState } from 'react';
import { Bold, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-md p-1.5 transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function normalizeHtml(html: string) {
  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<div></div>' || trimmed === '<br>') {
    return '';
  }
  return html;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'พิมพ์ข้อความ...',
  className,
  minHeight = '100px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [formats, setFormats] = useState({ bold: false, bulletList: false });

  const normalizedContent = useMemo(() => normalizeHtml(content), [content]);

  const updateFormats = () => {
    if (typeof document === 'undefined') return;
    setFormats({
      bold: document.queryCommandState('bold'),
      bulletList: document.queryCommandState('insertUnorderedList'),
    });
  };

  const emitChange = () => {
    const html = normalizeHtml(editorRef.current?.innerHTML || '');
    onChange(html);
    updateFormats();
  };

  const focusEditor = () => {
    editorRef.current?.focus();
    updateFormats();
  };

  const runCommand = (command: 'bold' | 'insertUnorderedList') => {
    focusEditor();
    document.execCommand(command, false);
    emitChange();
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const currentHtml = normalizeHtml(el.innerHTML);
    if (currentHtml !== normalizedContent) {
      el.innerHTML = normalizedContent;
    }
  }, [normalizedContent]);

  return (
    <div className={cn('overflow-hidden rounded-md border border-input bg-background', className)}>
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-1.5 py-1">
        <ToolbarButton
          active={formats.bold}
          onClick={() => runCommand('bold')}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={formats.bulletList}
          onClick={() => runCommand('insertUnorderedList')}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarButton>
      </div>

      <div className="relative">
        {!normalizeHtml(editorRef.current?.innerHTML || normalizedContent) && !isFocused && (
          <div className="pointer-events-none absolute left-3 top-2 text-xs text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={() => {
            setIsFocused(false);
            emitChange();
          }}
          onFocus={() => {
            setIsFocused(true);
            updateFormats();
          }}
          onKeyUp={updateFormats}
          onMouseUp={updateFormats}
          className="prose prose-sm max-w-none px-3 py-2 text-xs leading-relaxed focus:outline-none"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

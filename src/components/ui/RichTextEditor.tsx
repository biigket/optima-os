import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import {
  Bold, Italic, List, ListOrdered, Heading2, Minus, Highlighter, Type, Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const HIGHLIGHT_COLORS = [
  { label: 'เหลือง', color: '#fef08a' },
  { label: 'เขียว', color: '#bbf7d0' },
  { label: 'ฟ้า', color: '#bfdbfe' },
  { label: 'ชมพู', color: '#fecdd3' },
];

const TEXT_COLORS = [
  { label: 'Default', color: 'inherit' },
  { label: 'แดง', color: '#dc2626' },
  { label: 'น้ำเงิน', color: '#2563eb' },
  { label: 'เขียว', color: '#16a34a' },
  { label: 'ส้ม', color: '#ea580c' },
];

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
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'พิมพ์ข้อความ...',
  className,
  minHeight = '100px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-3 py-2 text-xs leading-relaxed`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (e.g. AI suggestion apply)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className={cn('rounded-md border border-input bg-background overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border bg-muted/30 flex-wrap">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={13} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading"
        >
          <Heading2 size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Section Divider"
        >
          <Minus size={13} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Highlight colors */}
        <div className="flex items-center gap-0.5">
          <Highlighter size={11} className="text-muted-foreground mr-0.5" />
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.color}
              type="button"
              title={`Highlight ${c.label}`}
              onClick={() => {
                if (editor.isActive('highlight', { color: c.color })) {
                  editor.chain().focus().unsetHighlight().run();
                } else {
                  editor.chain().focus().toggleHighlight({ color: c.color }).run();
                }
              }}
              className={cn(
                'w-4 h-4 rounded-sm border transition-all',
                editor.isActive('highlight', { color: c.color })
                  ? 'ring-1 ring-primary ring-offset-1 border-primary'
                  : 'border-border hover:scale-110'
              )}
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>

        <ToolbarDivider />

        {/* Text colors */}
        <div className="flex items-center gap-0.5">
          <Type size={11} className="text-muted-foreground mr-0.5" />
          {TEXT_COLORS.map((c) => (
            <button
              key={c.color}
              type="button"
              title={`สี${c.label}`}
              onClick={() => {
                if (c.color === 'inherit') {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().setColor(c.color).run();
                }
              }}
              className={cn(
                'w-4 h-4 rounded-sm border transition-all flex items-center justify-center',
                editor.isActive('textStyle', { color: c.color })
                  ? 'ring-1 ring-primary ring-offset-1 border-primary'
                  : 'border-border hover:scale-110'
              )}
            >
              <span
                className="text-[10px] font-bold leading-none"
                style={{ color: c.color === 'inherit' ? 'hsl(var(--foreground))' : c.color }}
              >
                A
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={13} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={13} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

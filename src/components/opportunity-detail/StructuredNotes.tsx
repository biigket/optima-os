import { Sparkles } from 'lucide-react';

interface StructuredNotesProps {
  content: string;
  className?: string;
}

const AI_SEPARATOR = '---';
const AI_HEADER = '💡 คำแนะนำ:';

function parseLines(text: string) {
  return text.split('\n').filter(line => line.trim());
}

function isNumberedItem(line: string) {
  return /^\d+\.\s/.test(line.trim());
}

function isBulletItem(line: string) {
  return /^[•\-]\s/.test(line.trim());
}

function RenderBlock({ text, isAi }: { text: string; isAi: boolean }) {
  const lines = parseLines(text);
  if (lines.length === 0) return null;

  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ol' | 'ul'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type === 'ol' ? 'ol' : 'ul';
    elements.push(
      <ListTag
        key={elements.length}
        className={`space-y-1 ${currentList.type === 'ol' ? 'list-decimal' : 'list-disc'} pl-4`}
      >
        {currentList.items.map((item, i) => (
          <li key={i} className="text-[11px] text-foreground/90 leading-relaxed">
            {item}
          </li>
        ))}
      </ListTag>
    );
    currentList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip the AI header line — we render it separately
    if (trimmed === AI_HEADER || trimmed.startsWith('💡 คำแนะนำ')) continue;

    if (isNumberedItem(trimmed)) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s/, ''));
    } else if (isBulletItem(trimmed)) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.replace(/^[•\-]\s/, ''));
    } else {
      flushList();
      elements.push(
        <p key={elements.length} className="text-[11px] text-foreground/90 leading-relaxed">
          {trimmed}
        </p>
      );
    }
  }
  flushList();

  if (isAi) {
    return (
      <div className="rounded-md border border-primary/20 bg-primary/5 p-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary shrink-0" />
          <span className="text-[10px] font-semibold text-primary">AI คำแนะนำ</span>
        </div>
        {elements}
      </div>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

export default function StructuredNotes({ content, className }: StructuredNotesProps) {
  if (!content?.trim()) return null;

  const hasSeparator = content.includes(AI_SEPARATOR);
  const hasAiHeader = content.includes('💡 คำแนะนำ');

  if (hasSeparator) {
    const [userPart, ...aiParts] = content.split(AI_SEPARATOR);
    const aiPart = aiParts.join(AI_SEPARATOR);
    return (
      <div className={`space-y-2 ${className || ''}`}>
        {userPart.trim() && <RenderBlock text={userPart} isAi={false} />}
        {aiPart.trim() && <RenderBlock text={aiPart} isAi={true} />}
      </div>
    );
  }

  if (hasAiHeader) {
    return (
      <div className={className}>
        <RenderBlock text={content} isAi={true} />
      </div>
    );
  }

  return (
    <div className={className}>
      <RenderBlock text={content} isAi={false} />
    </div>
  );
}

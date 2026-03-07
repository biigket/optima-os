import { Sparkles } from 'lucide-react';

interface StructuredNotesProps {
  content: string;
  className?: string;
}

function isHtml(text: string) {
  return /<[a-z][\s\S]*>/i.test(text);
}

export default function StructuredNotes({ content, className }: StructuredNotesProps) {
  if (!content?.trim()) return null;

  // If content is HTML (from rich editor), render it directly with prose styling
  if (isHtml(content)) {
    const hasAiContent = content.includes('💡') || content.includes('คำแนะนำ');
    
    return (
      <div className={className}>
        {hasAiContent && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-primary shrink-0" />
            <span className="text-[10px] font-semibold text-primary">AI คำแนะนำ</span>
          </div>
        )}
        <div 
          className="prose prose-sm max-w-none text-[11px] leading-relaxed
            [&_h2]:text-xs [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
            [&_h3]:text-[11px] [&_h3]:font-semibold [&_h3]:mb-1
            [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ul]:my-1
            [&_ol]:pl-4 [&_ol]:space-y-0.5 [&_ol]:my-1
            [&_li]:text-[11px]
            [&_p]:text-[11px] [&_p]:my-0.5
            [&_hr]:my-2 [&_hr]:border-border
            [&_strong]:font-semibold
            [&_mark]:px-0.5 [&_mark]:rounded-sm"
          dangerouslySetInnerHTML={{ __html: content }} 
        />
      </div>
    );
  }

  // Legacy plain text rendering
  const AI_SEPARATOR = '---';
  const hasAiHeader = content.includes('💡 คำแนะนำ');
  const hasSeparator = content.includes(AI_SEPARATOR);

  if (hasSeparator) {
    const [userPart, ...aiParts] = content.split(AI_SEPARATOR);
    const aiPart = aiParts.join(AI_SEPARATOR);
    return (
      <div className={`space-y-2 ${className || ''}`}>
        {userPart.trim() && <PlainBlock text={userPart} />}
        {aiPart.trim() && <AiBlock text={aiPart} />}
      </div>
    );
  }

  if (hasAiHeader) {
    return <div className={className}><AiBlock text={content} /></div>;
  }

  return <div className={className}><PlainBlock text={content} /></div>;
}

function AiBlock({ text }: { text: string }) {
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Sparkles size={11} className="text-primary shrink-0" />
        <span className="text-[10px] font-semibold text-primary">AI คำแนะนำ</span>
      </div>
      <ol className="list-decimal pl-4 space-y-0.5">
        {lines
          .filter(l => !l.startsWith('💡'))
          .map((l, i) => (
            <li key={i} className="text-[11px] text-foreground/90 leading-relaxed">
              {l.replace(/^\d+\.\s/, '')}
            </li>
          ))}
      </ol>
    </div>
  );
}

function PlainBlock({ text }: { text: string }) {
  return <p className="text-[11px] text-foreground/90 whitespace-pre-line leading-relaxed">{text}</p>;
}

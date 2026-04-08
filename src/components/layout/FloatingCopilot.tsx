import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingCopilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { pathname } = useLocation();

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        setMessages([...updatedMessages, { role: 'assistant', content: 'กรุณาตั้งค่า VITE_ANTHROPIC_API_KEY ในไฟล์ .env' }]);
        return;
      }

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `คุณคือ Optima AI ผู้ช่วย CRM สำหรับทีมขาย Doublo Thailand\nหน้าปัจจุบัน: ${pathname}\nตอบเป็นภาษาไทย กระชับ ตรงประเด็น ไม่เกิน 3 ประโยค`,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      const assistantText = data.content?.[0]?.text || 'ไม่สามารถตอบได้ในขณะนี้';
      setMessages([...updatedMessages, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      setMessages([...updatedMessages, { role: 'assistant', content: `ขออภัย เกิดข้อผิดพลาด: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        title="Optima AI (Ctrl+K)"
      >
        <MessageCircle size={22} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[400px] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-sm font-semibold">Optima AI</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              ผู้ช่วย CRM สำหรับทีมขาย Doublo Thailand
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-8">
                สวัสดี! ถามอะไรก็ได้เกี่ยวกับ CRM
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                กำลังคิด...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t px-4 py-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="พิมพ์ข้อความ..."
                rows={1}
                className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground text-center">
              Ctrl+K เพื่อเปิด/ปิด
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

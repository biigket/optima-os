import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AiNextStepBannerProps {
  opportunity: {
    stage: string;
    expected_value?: number;
    created_at: string;
    interested_products?: string[];
    close_date?: string;
  };
  accountName?: string;
  hasQuotation?: boolean;
}

export default function AiNextStepBanner({ opportunity, accountName, hasQuotation }: AiNextStepBannerProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const fetchSuggestion = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setSuggestion(null);

    try {
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
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: `โอกาสขาย: ${accountName || '-'}
Stage: ${opportunity.stage}
มูลค่า: ${opportunity.expected_value || 0} บาท
วันที่อัปเดตล่าสุด: ${opportunity.created_at}
ส่ง quotation แล้ว: ${hasQuotation ? 'ใช่' : 'ไม่'}

แนะนำ next step ที่สำคัญที่สุด 1 ข้อสำหรับ sales rep
ตอบเป็นภาษาไทย ไม่เกิน 2 ประโยค`,
          }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setSuggestion(data.content?.[0]?.text || null);
    } catch {
      setSuggestion('ไม่สามารถโหลดคำแนะนำได้');
    } finally {
      setLoading(false);
    }
  }, [apiKey, opportunity.stage, opportunity.expected_value, opportunity.created_at, accountName, hasQuotation]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSuggestion();
  }, [fetchSuggestion]);

  if (!apiKey) return null;

  return (
    <div className="relative bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-blue-600">AI แนะนำ</p>
          {loading ? (
            <Skeleton className="h-4 w-3/4" />
          ) : (
            <p className="text-sm text-gray-700">{suggestion}</p>
          )}
        </div>
        <button
          onClick={() => { hasFetched.current = false; fetchSuggestion(); }}
          disabled={loading}
          className="shrink-0 p-1 rounded hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="รีเฟรช"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}

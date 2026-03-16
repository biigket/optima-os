import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const stageLabels: Record<string, string> = {
  NEW_LEAD: 'ลีดใหม่',
  CONTACTED: 'ติดต่อแล้ว',
  DEMO_SCHEDULED: 'นัดเดโม',
  DEMO_DONE: 'เดโมแล้ว',
  NEGOTIATION: 'เจรจา',
  FOLLOW_UP: 'ติดตาม',
  WAITING_APPROVAL: 'รออนุมัติ',
  COMPARING: 'เปรียบเทียบ',
};

const colors = [
  'hsl(215, 70%, 60%)',
  'hsl(195, 65%, 55%)',
  'hsl(170, 60%, 50%)',
  'hsl(145, 55%, 50%)',
  'hsl(35, 80%, 55%)',
  'hsl(25, 75%, 55%)',
  'hsl(350, 65%, 55%)',
  'hsl(280, 50%, 55%)',
];

interface Props {
  data: { stage: string; count: number; value: number }[];
}

export default function PipelineChart({ data }: Props) {
  const chartData = data.map(d => ({
    name: stageLabels[d.stage] || d.stage,
    count: d.count,
    value: d.value,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          Pipeline ตาม Stage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">ยังไม่มีข้อมูล Pipeline</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(val: number, name: string) => {
                  if (name === 'count') return [val, 'จำนวน'];
                  return [`฿${val.toLocaleString()}`, 'มูลค่า'];
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

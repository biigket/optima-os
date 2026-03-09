import { Card, CardContent } from '@/components/ui/card';
import { Banknote, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PaymentKpiData {
  totalDue: number;
  totalPaid: number;
  pendingVerify: number;
  overdue: number;
}

const fmt = (n: number) => `฿${n.toLocaleString()}`;

export default function PaymentKpiCards({ data }: { data: PaymentKpiData }) {
  const cards = [
    { label: 'ยอดรวมค้างชำระ', value: fmt(data.totalDue), icon: Banknote, color: 'text-destructive' },
    { label: 'ชำระแล้ว', value: fmt(data.totalPaid), icon: CheckCircle2, color: 'text-success' },
    { label: 'รอตรวจสอบสลิป', value: data.pendingVerify.toString(), icon: Clock, color: 'text-warning' },
    { label: 'เกินกำหนด', value: data.overdue.toString(), icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'เงินสด' },
  { value: 'CREDIT_CARD', label: 'บัตรเครดิต', sub: [
    { value: 'CREDIT_CARD_FULL', label: 'รูดเต็ม' },
    { value: 'CREDIT_CARD_3M', label: 'ผ่อน 3 เดือน' },
    { value: 'CREDIT_CARD_6M', label: 'ผ่อน 6 เดือน' },
    { value: 'CREDIT_CARD_10M', label: 'ผ่อน 10 เดือน' },
  ]},
  { value: 'CREDIT', label: 'เครดิต', sub: [
    { value: 'CREDIT_15D', label: '15 วัน' },
    { value: 'CREDIT_30D', label: '30 วัน' },
  ]},
  { value: 'LEASING', label: 'ลีสซิ่ง', sub: [
    { value: 'LEASING_12M', label: 'ผ่อน 12 เดือน' },
  ]},
  { value: 'POST_CHECK', label: 'โพสต์เช็คกับบริษัท', sub: [
    { value: 'POST_CHECK_3M', label: '3 เดือน' },
    { value: 'POST_CHECK_6M', label: '6 เดือน' },
    { value: 'POST_CHECK_12M', label: '12 เดือน' },
  ]},
  { value: 'DIRECT_INSTALLMENT', label: 'ผ่อนตรงกับบริษัท', sub: [
    { value: 'DIRECT_INSTALLMENT_3M', label: '3 เดือน' },
    { value: 'DIRECT_INSTALLMENT_6M', label: '6 เดือน' },
    { value: 'DIRECT_INSTALLMENT_12M', label: '12 เดือน' },
  ]},
];

// Build a flat map for display
const ALL_LABELS: Record<string, string> = {};
PAYMENT_OPTIONS.forEach(opt => {
  if (opt.sub) {
    opt.sub.forEach(s => { ALL_LABELS[s.value] = `${opt.label} - ${s.label}`; });
  } else {
    ALL_LABELS[opt.value] = opt.label;
  }
});

export function getPaymentConditionLabel(value?: string | null): string {
  if (!value) return '-';
  return ALL_LABELS[value] || value;
}

function getParentKey(value: string): string {
  for (const opt of PAYMENT_OPTIONS) {
    if (opt.value === value) return value;
    if (opt.sub?.some(s => s.value === value)) return opt.value;
  }
  return value;
}

interface Props {
  paymentCondition: string;
  onPaymentConditionChange: (v: string) => void;
  depositType: string; // 'NONE' | 'AMOUNT' | 'PERCENT'
  depositValue: string;
  onDepositTypeChange: (v: string) => void;
  onDepositValueChange: (v: string) => void;
  totalPrice?: number;
}

export default function PaymentConditionSelector({
  paymentCondition,
  onPaymentConditionChange,
  depositType,
  depositValue,
  onDepositTypeChange,
  onDepositValueChange,
  totalPrice,
}: Props) {
  const parentKey = getParentKey(paymentCondition);
  const parentOption = PAYMENT_OPTIONS.find(o => o.value === parentKey);
  const hasSub = parentOption?.sub && parentOption.sub.length > 0;

  const depositNum = Number(depositValue) || 0;
  const computedDeposit = depositType === 'PERCENT' && totalPrice
    ? (totalPrice * depositNum / 100)
    : depositNum;

  return (
    <div className="space-y-4">
      {/* Main payment condition */}
      <div className="space-y-1.5">
        <Label>เงื่อนไขการชำระเงิน</Label>
        <Select
          value={parentKey}
          onValueChange={v => {
            const opt = PAYMENT_OPTIONS.find(o => o.value === v);
            if (opt?.sub && opt.sub.length > 0) {
              onPaymentConditionChange(opt.sub[0].value);
            } else {
              onPaymentConditionChange(v);
            }
          }}
        >
          <SelectTrigger><SelectValue placeholder="เลือกเงื่อนไข" /></SelectTrigger>
          <SelectContent>
            {PAYMENT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub option */}
      {hasSub && parentOption.sub && (
        <div className="space-y-1.5 pl-4 border-l-2 border-primary/20">
          <Label className="text-xs text-muted-foreground">ตัวเลือกย่อย</Label>
          <Select value={paymentCondition} onValueChange={onPaymentConditionChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {parentOption.sub.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Deposit */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Label className="text-sm font-medium">เงื่อนไขมัดจำ</Label>
        <RadioGroup
          value={depositType}
          onValueChange={v => {
            onDepositTypeChange(v);
            if (v === 'NONE') onDepositValueChange('0');
          }}
          className="flex gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="NONE" id="dep-none" />
            <Label htmlFor="dep-none" className="text-sm cursor-pointer">ไม่มีมัดจำ</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="AMOUNT" id="dep-amount" />
            <Label htmlFor="dep-amount" className="text-sm cursor-pointer">จำนวนเงิน (฿)</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="PERCENT" id="dep-percent" />
            <Label htmlFor="dep-percent" className="text-sm cursor-pointer">เปอร์เซ็นต์ (%)</Label>
          </div>
        </RadioGroup>

        {depositType !== 'NONE' && (
          <div className="flex items-center gap-3 mt-2">
            <Input
              type="number"
              min="0"
              placeholder={depositType === 'PERCENT' ? 'เช่น 30' : 'เช่น 50000'}
              value={depositValue}
              onChange={e => onDepositValueChange(e.target.value)}
              className="max-w-[180px]"
            />
            <span className="text-sm text-muted-foreground">
              {depositType === 'PERCENT' ? '%' : '฿'}
            </span>
            {depositType === 'PERCENT' && totalPrice && depositNum > 0 && (
              <span className="text-sm text-primary font-medium">
                = ฿{computedDeposit.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

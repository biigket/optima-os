export type UnifiedStockStatus = 'พร้อมขาย' | 'ติดตั้งแล้ว' | 'ติดจอง' | 'DEMO/ยืม' | 'รอซ่อม/รอ QC' | 'รอเคลม ตปท.';

export const unifiedStatuses: UnifiedStockStatus[] = [
  'พร้อมขาย',
  'ติดตั้งแล้ว',
  'ติดจอง',
  'DEMO/ยืม',
  'รอซ่อม/รอ QC',
  'รอเคลม ตปท.',
];

export const unifiedStatusColor: Record<UnifiedStockStatus, string> = {
  'พร้อมขาย': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ติดตั้งแล้ว': 'bg-muted text-muted-foreground border-border',
  'ติดจอง': 'bg-amber-100 text-amber-800 border-amber-200',
  'DEMO/ยืม': 'bg-blue-100 text-blue-800 border-blue-200',
  'รอซ่อม/รอ QC': 'bg-orange-100 text-orange-800 border-orange-200',
  'รอเคลม ตปท.': 'bg-purple-100 text-purple-800 border-purple-200',
};

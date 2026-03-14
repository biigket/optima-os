import type { UnifiedStockStatus } from './unifiedStockStatus';

export interface PicohiStockItem {
  id: string;
  serialNumber: string;
  handpiece: string;
  status: UnifiedStockStatus;
  reservedFor?: string;
  failReason: string;
  receivedDate: string;
  storageLocation: string;
  notes: string;
}

export const mockPicohiStock: PicohiStockItem[] = [
  {
    id: 'ph-001',
    serialNumber: 'PH-2024-0001',
    handpiece: 'HP-PH100',
    status: 'พร้อมขาย',
    failReason: '',
    receivedDate: '2025-01-10',
    storageLocation: 'คลัง A ชั้น 1',
    notes: '',
  },
  {
    id: 'ph-002',
    serialNumber: 'PH-2024-0002',
    handpiece: 'HP-PH200',
    status: 'ติดตั้งแล้ว',
    failReason: '',
    receivedDate: '2024-12-15',
    storageLocation: 'คลัง B ชั้น 1',
    notes: '',
  },
  {
    id: 'ph-003',
    serialNumber: 'PH-2025-0003',
    handpiece: 'HP-PH100',
    status: 'รอซ่อม/รอ QC',
    failReason: 'Laser output ต่ำกว่ามาตรฐาน',
    receivedDate: '2025-02-20',
    storageLocation: 'คลัง A ชั้น 2',
    notes: 'ส่งตรวจ QC',
  },
];

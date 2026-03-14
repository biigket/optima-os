import type { UnifiedStockStatus } from './unifiedStockStatus';

export interface FreezeroStockItem {
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

export const mockFreezeroStock: FreezeroStockItem[] = [
  {
    id: 'fz-001',
    serialNumber: 'FZ-2024-0001',
    handpiece: 'HP-FZ100',
    status: 'พร้อมขาย',
    failReason: '',
    receivedDate: '2025-01-15',
    storageLocation: 'คลัง A ชั้น 1',
    notes: '',
  },
  {
    id: 'fz-002',
    serialNumber: 'FZ-2024-0002',
    handpiece: 'HP-FZ200',
    status: 'DEMO/ยืม',
    failReason: '',
    receivedDate: '2024-11-20',
    storageLocation: 'คลัง B ชั้น 2',
    notes: 'ยืมให้ Demo คลินิก ABC',
  },
  {
    id: 'fz-003',
    serialNumber: 'FZ-2025-0003',
    handpiece: 'HP-FZ100',
    status: 'ติดจอง',
    failReason: '',
    receivedDate: '2025-03-01',
    storageLocation: 'คลัง A ชั้น 2',
    notes: 'จองให้คลินิก XYZ',
  },
];

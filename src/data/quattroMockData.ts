import type { UnifiedStockStatus } from './unifiedStockStatus';

export interface QuattroStockItem {
  id: string;
  serialNumber: string;
  handpiece: string;
  status: UnifiedStockStatus;
  failReason: string;
  receivedDate: string;
  storageLocation: string;
  notes: string;
}

export const mockQuattroStock: QuattroStockItem[] = [
  {
    id: 'qt-001',
    serialNumber: 'QT-2024-0001',
    handpiece: 'HP-A100',
    status: 'พร้อมขาย',
    failReason: '',
    receivedDate: '2024-12-01',
    storageLocation: 'คลัง A',
    notes: '',
  },
  {
    id: 'qt-002',
    serialNumber: 'QT-2024-0002',
    handpiece: 'HP-B200',
    status: 'ติดตั้งแล้ว',
    failReason: '',
    receivedDate: '2024-11-20',
    storageLocation: 'คลัง B',
    notes: '',
  },
  {
    id: 'qt-003',
    serialNumber: 'QT-2024-0003',
    handpiece: 'HP-A100',
    status: 'DEMO/ยืม',
    failReason: '',
    receivedDate: '2024-12-05',
    storageLocation: 'คลัง A',
    notes: 'ยืมให้คลินิก XYZ',
  },
  {
    id: 'qt-004',
    serialNumber: 'QT-2024-0004',
    handpiece: 'HP-C300',
    status: 'รอซ่อม/รอ QC',
    failReason: 'หัว Handpiece ชำรุด',
    receivedDate: '2024-11-15',
    storageLocation: 'คลัง C',
    notes: '',
  },
  {
    id: 'qt-005',
    serialNumber: 'QT-2024-0005',
    handpiece: 'HP-B200',
    status: 'ติดจอง',
    failReason: '',
    receivedDate: '2024-12-10',
    storageLocation: 'คลัง A',
    notes: 'จองให้คลินิก ABC',
  },
  {
    id: 'qt-006',
    serialNumber: 'QT-2024-0006',
    handpiece: 'HP-A100',
    status: 'รอเคลม ตปท.',
    failReason: 'ระบบไฟฟ้าผิดปกติ',
    receivedDate: '2024-10-25',
    storageLocation: 'คลัง B',
    notes: 'ส่งเคลมไปแล้ว',
  },
];

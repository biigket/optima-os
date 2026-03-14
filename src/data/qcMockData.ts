import type { UnifiedStockStatus } from './unifiedStockStatus';

export type HrmSellOrKeep = 'ขาย' | 'เก็บ';

export interface ND2StockItem {
  id: string;
  productType: 'ND2';
  hntSerialNumber: string;
  hfl1: string;
  hfl2: string;
  hsd1: string;
  hsd2: string;
  hrm: string;
  hrmSellOrKeep: HrmSellOrKeep;
  upsStabilizer: string;
  status: UnifiedStockStatus;
  reservedFor: string;
  clinic: string;
  qcFailReason: string;
  notes: string;
  receivedDate: string;
  inspectionDoc: string;
  storageLocation: string;
}

export const mockND2Stock: ND2StockItem[] = [
  {
    id: 'qc-1',
    productType: 'ND2',
    hntSerialNumber: 'HNT01250051',
    hfl1: 'HFL02240313', hfl2: 'HFL02240353',
    hsd1: 'HSD0324358C', hsd2: 'HSD0324356C',
    hrm: 'HRM04231475', hrmSellOrKeep: 'ขาย',
    upsStabilizer: '',
    status: 'ติดตั้งแล้ว',
    reservedFor: '', clinic: 'KRM Clinic',
    qcFailReason: '', notes: '',
    receivedDate: '', inspectionDoc: '', storageLocation: '',
  },
  {
    id: 'qc-2',
    productType: 'ND2',
    hntSerialNumber: 'HNT01240036',
    hfl1: 'HFL02241584', hfl2: 'HFL02241734',
    hsd1: 'HSD03242284', hsd2: 'HSD03242224',
    hrm: 'HRM04240554', hrmSellOrKeep: 'ขาย',
    upsStabilizer: '',
    status: 'ติดตั้งแล้ว',
    reservedFor: '', clinic: 'A-listic clinic',
    qcFailReason: '', notes: '',
    receivedDate: '2024-08-01', inspectionDoc: '', storageLocation: '',
  },
  {
    id: 'qc-3',
    productType: 'ND2',
    hntSerialNumber: 'HNT01240067',
    hfl1: 'HFL02241354', hfl2: 'HFL02242114',
    hsd1: 'HSD03242334', hsd2: 'HSD03242094',
    hrm: 'HRM04240186', hrmSellOrKeep: 'ขาย',
    upsStabilizer: '',
    status: 'ติดตั้งแล้ว',
    reservedFor: '', clinic: 'Dr.Orawan clinic',
    qcFailReason: '', notes: '',
    receivedDate: '2024-08-01', inspectionDoc: '', storageLocation: '',
  },
  {
    id: 'qc-4',
    productType: 'ND2',
    hntSerialNumber: 'HNT01250099',
    hfl1: 'HFL02250101', hfl2: 'HFL02250102',
    hsd1: 'HSD03250201', hsd2: 'HSD03250202',
    hrm: 'HRM04250301', hrmSellOrKeep: 'เก็บ',
    upsStabilizer: 'ZK0022025HDR30001',
    status: 'พร้อมขาย',
    reservedFor: '', clinic: '',
    qcFailReason: '', notes: '',
    receivedDate: '2025-03-01', inspectionDoc: '', storageLocation: 'คลัง A ชั้น 2',
  },
  {
    id: 'qc-5',
    productType: 'ND2',
    hntSerialNumber: 'HNT01250100',
    hfl1: 'HFL02250111', hfl2: 'HFL02250112',
    hsd1: 'HSD03250211', hsd2: 'HSD03250212',
    hrm: 'HRM04250311', hrmSellOrKeep: 'ขาย',
    upsStabilizer: '',
    status: 'ติดจอง',
    reservedFor: 'Skin Plus Clinic', clinic: '',
    qcFailReason: '', notes: 'รอตรวจ QC',
    receivedDate: '2025-03-05', inspectionDoc: '', storageLocation: 'คลัง A ชั้น 1',
  },
  {
    id: 'qc-6',
    productType: 'ND2',
    hntSerialNumber: 'HNT01250088',
    hfl1: 'HFL02250088', hfl2: 'HFL02250089',
    hsd1: 'HSD03250088', hsd2: 'HSD03250089',
    hrm: 'HRM04250088', hrmSellOrKeep: 'ขาย',
    upsStabilizer: '',
    status: 'รอซ่อม/รอ QC',
    reservedFor: '', clinic: '',
    qcFailReason: 'HFL handpiece ไม่ทำงาน', notes: 'ส่งซ่อมกลับโรงงาน',
    receivedDate: '2025-02-20', inspectionDoc: '', storageLocation: '',
  },
];

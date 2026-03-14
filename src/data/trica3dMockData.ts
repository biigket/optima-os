import type { UnifiedStockStatus } from './unifiedStockStatus';

export interface Trica3DStockItem {
  id: string;
  serialNumber: string;
  clinic: string;
  status: UnifiedStockStatus;
  reservedFor?: string;
  receivedDate: string;
  installDate: string;
  failReason: string;
  borrowFrom: string;
  borrowTo: string;
  emailTrica: string;
  notes: string;
  storageLocation: string;
}

export const mockTrica3DStock: Trica3DStockItem[] = [
  { id: 'trica-1', serialNumber: 'A0FD10LRBK00AH2216', clinic: 'นิติธรรม พิษณุโลก', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2024-10-05', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-2', serialNumber: 'A0FD10DRBK00AH2903', clinic: 'Absolute Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2024-10-05', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-3', serialNumber: 'A0FD10LRBK00AH2814', clinic: 'The Wish Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2024-10-10', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-4', serialNumber: 'A0FD10LRBK00AH2217', clinic: 'KVK@Saim Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2024-11-20', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-5', serialNumber: 'A0FD10HRBK00AH0808', clinic: 'The Connection Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-6', serialNumber: 'A0FD10LRBK00AH1403', clinic: 'S-mart Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-01-07', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-7', serialNumber: 'A0FD10LRBK00AG2303', clinic: 'นิติธรรม สีลม', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2024-12-26', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-8', serialNumber: 'A0FD10LRBK00AI2406', clinic: 'KRM Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-02-07', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-9', serialNumber: 'A0FD10LRCK00BB0707', clinic: 'Beautique Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-04-10', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-10', serialNumber: 'A0FD10LRCK00BB0708', clinic: 'Temsiri Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-05-05', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-11', serialNumber: 'A0FD10LRCK00BF2823', clinic: 'Anton House Clinic จ.แพร่', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-08-20', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: 'Error 00073 - แก้ไขแล้ว ใช้ได้ปกติ', storageLocation: 'โกดัง' },
  { id: 'trica-12', serialNumber: 'A0FD10LRCK00BF2825', clinic: 'The Hazel Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2025-05-12', installDate: '2025-10-11', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: 'thehazeltrica@gmail.com', notes: '', storageLocation: 'โกดัง' },
  { id: 'trica-13', serialNumber: 'A0FD10YRCK00CA0811', clinic: 'Mellow Clinic', status: 'ติดตั้งแล้ว', receivedDate: '2026-03-02', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-14', serialNumber: 'A0FD10LRBK00AH1406', clinic: '', status: 'DEMO/ยืม', receivedDate: '', installDate: '', failReason: '', borrowFrom: '2025-01-09', borrowTo: '2025-04-30', emailTrica: '', notes: 'Upgrade แสงเหมือนเครื่องขายใหม่แล้ว', storageLocation: 'โกดัง' },
  { id: 'trica-15', serialNumber: 'A0FD10LBAK00AG1802', clinic: '', status: 'DEMO/ยืม', receivedDate: '', installDate: '', failReason: '', borrowFrom: '2025-07-24', borrowTo: '', emailTrica: '', notes: 'Upgrade แสงเหมือนเครื่องขายใหม่แล้ว', storageLocation: 'โกดัง' },
  { id: 'trica-16', serialNumber: 'A0FD10DRBK00AI0703', clinic: 'โรงพยาบาลรามาธิบดี', status: 'DEMO/ยืม', receivedDate: '', installDate: '', failReason: '', borrowFrom: '2025-06-20', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-17', serialNumber: 'A0FD10LRBK00AH2206', clinic: 'โรงพยาบาลยาสูบ', status: 'DEMO/ยืม', receivedDate: '', installDate: '', failReason: '', borrowFrom: '2025-06-30', borrowTo: '', emailTrica: '', notes: 'เครื่องเสียเก็บมาจากนิติธรรม แต่ยังใช้ได้ กล้องถ่ายติดบ้างไม่ติดบ้าง ต้อง Restart ถึงจะติด', storageLocation: '' },
  { id: 'trica-18', serialNumber: 'AXXXXXXXXXXXXXXX', clinic: 'ใช้เป็นคอมทำเอกสาร Service', status: 'รอซ่อม/รอ QC', receivedDate: '', installDate: '', failReason: 'เครื่องเสีย กล้องขึ้นไฟแดง แกะแยกชิ้นส่วนแล้ว', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: 'โกดัง' },
  { id: 'trica-19', serialNumber: 'A0FD10YRCK00CA0817', clinic: 'Rakta Clinic', status: 'ติดจอง', receivedDate: '2026-03-02', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-20', serialNumber: 'A0FD10YRCK00CA0821', clinic: 'Rakta Clinic', status: 'ติดจอง', receivedDate: '2026-03-02', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-21', serialNumber: 'A0FD10YRCK00CA0829', clinic: 'Doctor B Clinic', status: 'ติดจอง', receivedDate: '2026-03-02', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: '', storageLocation: '' },
  { id: 'trica-22', serialNumber: 'A0FD10AD09001', clinic: 'ศิริราช', status: 'DEMO/ยืม', receivedDate: '', installDate: '', failReason: '', borrowFrom: '', borrowTo: '', emailTrica: '', notes: 'ตัวที่ต้องนำไปศิริราชทุกครั้ง', storageLocation: 'Office' },
];

import type { UnifiedStockStatus } from './unifiedStockStatus';

export type CartridgeType = 'A2.0' | 'A3.0' | 'A4.5' | 'A6.0' | 'L1.5' | 'L3.0' | 'L4.5' | 'L9.0' | 'N49' | 'I49' | 'N25' | 'I25';

export interface CartridgeStockItem {
  id: string;
  serialNumber: string;
  cartridgeType: CartridgeType;
  status: UnifiedStockStatus;
  reservedFor?: string;
  qcFailReason: string;
  receivedDate: string;
  storageLocation: string;
}

export const cartridgeTypes: CartridgeType[] = ['A2.0', 'A3.0', 'A4.5', 'A6.0', 'L1.5', 'L3.0', 'L4.5', 'L9.0', 'N49', 'I49', 'N25', 'I25'];

export const mockCartridgeStock: CartridgeStockItem[] = [
  { id: 'cart-1', serialNumber: 'FLA225110069', cartridgeType: 'A2.0', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-02-28', storageLocation: 'คลัง A ชั้น 1' },
  { id: 'cart-2', serialNumber: 'FLA225310108', cartridgeType: 'A2.0', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-05-13', storageLocation: 'คลัง A ชั้น 1' },
  { id: 'cart-3', serialNumber: 'FLA226100003', cartridgeType: 'A2.0', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2026-02-02', storageLocation: 'คลัง A ชั้น 2' },
  { id: 'cart-4', serialNumber: 'FLA223910158', cartridgeType: 'A2.0', status: 'ติดตั้งแล้ว', qcFailReason: '', receivedDate: '2025-01-10', storageLocation: '' },
  { id: 'cart-5', serialNumber: 'FLA225110053', cartridgeType: 'A2.0', status: 'ติดตั้งแล้ว', qcFailReason: '', receivedDate: '2025-02-17', storageLocation: '' },
  { id: 'cart-6', serialNumber: 'FLA325910840', cartridgeType: 'A3.0', status: 'ติดตั้งแล้ว', qcFailReason: '', receivedDate: '2025-12-07', storageLocation: '' },
  { id: 'cart-7', serialNumber: 'FLA324C10776', cartridgeType: 'A3.0', status: 'รอซ่อม/รอ QC', qcFailReason: 'CODE 10', receivedDate: '2025-01-17', storageLocation: '' },
  { id: 'cart-8', serialNumber: 'FLA325510441', cartridgeType: 'A3.0', status: 'รอซ่อม/รอ QC', qcFailReason: 'Error Code 5', receivedDate: '2025-06-27', storageLocation: '' },
  { id: 'cart-9', serialNumber: 'FLA325C11013', cartridgeType: 'A3.0', status: 'รอซ่อม/รอ QC', qcFailReason: 'Hifu output is higher.', receivedDate: '2025-12-25', storageLocation: '' },
  { id: 'cart-10', serialNumber: 'FLA324810541', cartridgeType: 'A3.0', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2025-01-10', storageLocation: '' },
  { id: 'cart-11', serialNumber: 'FLA425710962', cartridgeType: 'A4.5', status: 'รอซ่อม/รอ QC', qcFailReason: 'มีปัญหา ยิงแล้วเจ็บ รอเช็ค', receivedDate: '2025-07-09', storageLocation: '' },
  { id: 'cart-12', serialNumber: 'FLA426111715', cartridgeType: 'A4.5', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2026-02-02', storageLocation: '' },
  { id: 'cart-13', serialNumber: 'FLA623710096', cartridgeType: 'A6.0', status: 'รอเคลม ตปท.', qcFailReason: '', receivedDate: '2025-01-17', storageLocation: '' },
  { id: 'cart-14', serialNumber: 'FLA623910194', cartridgeType: 'A6.0', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-02-28', storageLocation: 'คลัง A ชั้น 2' },
  { id: 'cart-15', serialNumber: 'SDL125610357', cartridgeType: 'L1.5', status: 'ติดตั้งแล้ว', qcFailReason: '', receivedDate: '2025-07-09', storageLocation: '' },
  { id: 'cart-16', serialNumber: 'SDL125910548', cartridgeType: 'L1.5', status: 'รอเคลม ตปท.', qcFailReason: 'RF ไม่ร้อน เคลมตปท.เรียบร้อยแล้ว', receivedDate: '2025-12-07', storageLocation: '' },
  { id: 'cart-17', serialNumber: 'SDL123210038', cartridgeType: 'L1.5', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2025-01-10', storageLocation: '' },
  { id: 'cart-18', serialNumber: 'SDL425C10655', cartridgeType: 'L4.5', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2026-02-02', storageLocation: 'คลัง B ชั้น 1' },
  { id: 'cart-19', serialNumber: 'SDL425510247', cartridgeType: 'L4.5', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2025-06-27', storageLocation: '' },
  { id: 'cart-20', serialNumber: 'SDL923710123', cartridgeType: 'L9.0', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-03-28', storageLocation: 'คลัง B ชั้น 2' },
  { id: 'cart-21', serialNumber: 'SDL923710120', cartridgeType: 'L9.0', status: 'ติดตั้งแล้ว', qcFailReason: '', receivedDate: '2025-03-28', storageLocation: '' },
  { id: 'cart-22', serialNumber: 'SDL925110145', cartridgeType: 'L9.0', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2025-06-27', storageLocation: '' },
  { id: 'cart-23', serialNumber: 'RMN49001', cartridgeType: 'N49', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-06-15', storageLocation: 'คลัง A ชั้น 1' },
  { id: 'cart-24', serialNumber: 'RMI49002', cartridgeType: 'I49', status: 'DEMO/ยืม', qcFailReason: '', receivedDate: '2025-06-20', storageLocation: '' },
  { id: 'cart-25', serialNumber: 'RMN25003', cartridgeType: 'N25', status: 'พร้อมขาย', qcFailReason: '', receivedDate: '2025-07-01', storageLocation: 'คลัง A ชั้น 2' },
  { id: 'cart-26', serialNumber: 'RMI25004', cartridgeType: 'I25', status: 'รอซ่อม/รอ QC', qcFailReason: 'Connection error', receivedDate: '2025-07-05', storageLocation: '' },
];

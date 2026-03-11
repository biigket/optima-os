export type CartridgeType = 'A2.0' | 'A3.0' | 'A4.5' | 'A6.0' | 'L1.5' | 'L3.0' | 'L4.5' | 'L9.0';

export type CartridgeStatus = 'พร้อมขาย' | 'ขายแล้ว' | 'ไม่ผ่าน QC' | 'DEMO' | 'Claim' | 'Support KOL';

export interface CartridgeStockItem {
  id: string;
  serialNumber: string;
  cartridgeType: CartridgeType;
  status: CartridgeStatus;
  qcFailReason: string;
  receivedDate: string;
  storageLocation: string;
}

export const cartridgeTypes: CartridgeType[] = ['A2.0', 'A3.0', 'A4.5', 'A6.0', 'L1.5', 'L3.0', 'L4.5', 'L9.0'];

export const cartridgeStatuses: CartridgeStatus[] = ['พร้อมขาย', 'ขายแล้ว', 'ไม่ผ่าน QC', 'DEMO', 'Claim', 'Support KOL'];

export const mockCartridgeStock: CartridgeStockItem[] = [];

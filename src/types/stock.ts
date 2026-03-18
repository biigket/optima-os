import type { UnifiedStockStatus } from '@/data/unifiedStockStatus';

// ND2
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

// Trica 3D
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

// Quattro
export interface QuattroStockItem {
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

// Picohi
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

// Freezero
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

// Cartridge
export type CartridgeType = 'A2.0' | 'A3.0' | 'A4.5' | 'A6.0' | 'L1.5' | 'L3.0' | 'L4.5' | 'L9.0' | 'N49' | 'I49' | 'N25' | 'I25';

export const cartridgeTypes: CartridgeType[] = ['A2.0', 'A3.0', 'A4.5', 'A6.0', 'L1.5', 'L3.0', 'L4.5', 'L9.0', 'N49', 'I49', 'N25', 'I25'];

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

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

export const mockCartridgeStock: CartridgeStockItem[] = [];

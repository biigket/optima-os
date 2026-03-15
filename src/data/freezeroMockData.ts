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

export const mockFreezeroStock: FreezeroStockItem[] = [];

import type { UnifiedStockStatus } from './unifiedStockStatus';

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

export const mockQuattroStock: QuattroStockItem[] = [];

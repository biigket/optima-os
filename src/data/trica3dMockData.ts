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

export const mockTrica3DStock: Trica3DStockItem[] = [];

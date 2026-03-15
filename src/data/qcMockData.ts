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

export const mockND2Stock: ND2StockItem[] = [];

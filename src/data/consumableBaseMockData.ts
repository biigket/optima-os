// Consumable Base types — data now stored in Supabase qc_stock_items table

import type { CartridgeType } from './cartridgeMockData';

export interface ConsumableInstallation {
  id: string;
  qcStockItemId: string;
  cartridgeType: CartridgeType;
  serialNumber: string;
  clinic: string;
  accountId?: string;
  deliveryDate: string;
  warrantyDays: number;
  warrantyExpiry: string;
  notes: string;
  depleted?: boolean;
}

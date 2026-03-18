// Consumable Base types — data stored in Supabase qc_stock_items table

import type { CartridgeType } from './stock';

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

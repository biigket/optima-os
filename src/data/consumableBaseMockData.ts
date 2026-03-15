// Consumable Base mock data - tracks cartridges delivered to customers (no PM)

import type { CartridgeType } from './cartridgeMockData';

export interface ConsumableInstallation {
  id: string;
  qcStockItemId: string; // links to cartridge stock item
  cartridgeType: CartridgeType;
  serialNumber: string;
  clinic: string;
  accountId?: string;
  deliveryDate: string; // วันส่งมอบ
  warrantyDays: number;
  warrantyExpiry: string;
  notes: string;
  depleted?: boolean; // ช็อตหมดแล้ว
}

// Pre-populated from cartridge stock items with status ติดตั้งแล้ว
export const mockConsumableInstallations: ConsumableInstallation[] = [];

// Get consumables for a specific account
export function getConsumablesForAccount(accountId: string, clinicName?: string): ConsumableInstallation[] {
  return mockConsumableInstallations.filter(inst =>
    inst.accountId === accountId ||
    (clinicName && inst.clinic.toLowerCase() === clinicName.toLowerCase())
  );
}

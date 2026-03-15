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
export const mockConsumableInstallations: ConsumableInstallation[] = [
  {
    id: 'cons-1',
    qcStockItemId: 'cart-4',
    cartridgeType: 'A2.0',
    serialNumber: 'FLA223910158',
    clinic: 'KRM Clinic',
    deliveryDate: '2025-01-15',
    warrantyDays: 180,
    warrantyExpiry: '2025-07-14',
    notes: '',
  },
  {
    id: 'cons-2',
    qcStockItemId: 'cart-5',
    cartridgeType: 'A2.0',
    serialNumber: 'FLA225110053',
    clinic: 'A-listic clinic',
    deliveryDate: '2025-02-20',
    warrantyDays: 180,
    warrantyExpiry: '2025-08-19',
    notes: '',
  },
  {
    id: 'cons-3',
    qcStockItemId: 'cart-6',
    cartridgeType: 'A3.0',
    serialNumber: 'FLA325910840',
    clinic: 'Dr.Orawan clinic',
    deliveryDate: '2025-12-10',
    warrantyDays: 180,
    warrantyExpiry: '2026-06-08',
    notes: '',
  },
  {
    id: 'cons-4',
    qcStockItemId: 'cart-15',
    cartridgeType: 'L1.5',
    serialNumber: 'SDL125610357',
    clinic: 'KRM Clinic',
    deliveryDate: '2025-07-15',
    warrantyDays: 180,
    warrantyExpiry: '2026-01-11',
    notes: '',
  },
  {
    id: 'cons-5',
    qcStockItemId: 'cart-21',
    cartridgeType: 'L9.0',
    serialNumber: 'SDL923710120',
    clinic: 'A-listic clinic',
    deliveryDate: '2025-04-01',
    warrantyDays: 180,
    warrantyExpiry: '2025-09-28',
    notes: '',
  },
];

// Get consumables for a specific account
export function getConsumablesForAccount(accountId: string, clinicName?: string): ConsumableInstallation[] {
  return mockConsumableInstallations.filter(inst =>
    inst.accountId === accountId ||
    (clinicName && inst.clinic.toLowerCase() === clinicName.toLowerCase())
  );
}

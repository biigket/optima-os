// Maps qc_stock_items DB rows to local TypeScript types
import type { ND2StockItem, HrmSellOrKeep } from './qcMockData';
import type { Trica3DStockItem } from './trica3dMockData';
import type { QuattroStockItem } from './quattroMockData';
import type { PicohiStockItem } from './picohiMockData';
import type { FreezeroStockItem } from './freezeroMockData';
import type { CartridgeStockItem, CartridgeType } from './cartridgeMockData';
import type { UnifiedStockStatus } from './unifiedStockStatus';

type DbRow = Record<string, any>;

/** Normalize diverse DB statuses to the 6 unified statuses */
export function normalizeStatus(raw: string | null): UnifiedStockStatus {
  if (!raw) return 'พร้อมขาย';
  const s = raw.trim();
  if (s === 'พร้อมขาย' || s.includes('พร้อมส่ง')) return 'พร้อมขาย';
  if (s === 'ติดจอง') return 'ติดจอง';
  if (s === 'ติดตั้งแล้ว') return 'ติดตั้งแล้ว';
  if (s.startsWith('DEMO') || s === 'ยืม') return 'DEMO/ยืม';
  if (s === 'รอซ่อม/รอ QC' || s === 'เครื่องเสีย') return 'รอซ่อม/รอ QC';
  if (s === 'รอเคลม ตปท.') return 'รอเคลม ตปท.';
  // Fallback for others like เครื่องอะไหล่, รับกลับบริษัท
  if (s === 'เครื่องอะไหล่' || s === 'รับกลับบริษัท') return 'รอซ่อม/รอ QC';
  return 'พร้อมขาย';
}

/** Normalize product_type from DB to standard keys */
export function normalizeProductType(raw: string): string {
  const upper = raw.toUpperCase().trim();
  if (upper === 'ND2') return 'ND2';
  if (upper === 'TRICA 3D' || upper === 'TRICA3D') return 'TRICA 3D';
  if (upper === 'QUATTRO') return 'QUATTRO';
  if (upper === 'PICOHI300' || upper === 'PICOHI') return 'PICOHI300';
  if (upper === 'FREEZERO') return 'FREEZERO';
  if (upper === 'CARTRIDGE') return 'CARTRIDGE';
  return raw;
}

export function mapND2(row: DbRow): ND2StockItem {
  return {
    id: row.id,
    productType: 'ND2',
    hntSerialNumber: row.serial_number || '',
    hfl1: row.hfl1 || '',
    hfl2: row.hfl2 || '',
    hsd1: row.hsd1 || '',
    hsd2: row.hsd2 || '',
    hrm: row.hrm || '',
    hrmSellOrKeep: (row.hrm_sell_or_keep || 'ขาย') as HrmSellOrKeep,
    upsStabilizer: row.ups_stabilizer || '',
    status: normalizeStatus(row.status),
    reservedFor: row.reserved_for || '',
    clinic: row.clinic || '',
    qcFailReason: row.fail_reason || '',
    notes: row.notes || '',
    receivedDate: row.received_date || '',
    inspectionDoc: row.inspection_doc || '',
    storageLocation: row.storage_location || '',
  };
}

export function mapTrica3D(row: DbRow): Trica3DStockItem {
  return {
    id: row.id,
    serialNumber: row.serial_number || '',
    clinic: row.clinic || '',
    status: normalizeStatus(row.status),
    reservedFor: row.reserved_for,
    receivedDate: row.received_date || '',
    installDate: row.install_date || '',
    failReason: row.fail_reason || '',
    borrowFrom: row.borrow_from || '',
    borrowTo: row.borrow_to || '',
    emailTrica: row.email_trica || '',
    notes: row.notes || '',
    storageLocation: row.storage_location || '',
  };
}

export function mapGenericStock(row: DbRow): QuattroStockItem & PicohiStockItem & FreezeroStockItem {
  return {
    id: row.id,
    serialNumber: row.serial_number || '',
    handpiece: row.handpiece || '',
    status: normalizeStatus(row.status),
    reservedFor: row.reserved_for,
    failReason: row.fail_reason || '',
    receivedDate: row.received_date || '',
    storageLocation: row.storage_location || '',
    notes: row.notes || '',
  };
}

export function mapCartridge(row: DbRow): CartridgeStockItem {
  return {
    id: row.id,
    serialNumber: row.serial_number || '',
    cartridgeType: (row.cartridge_type || 'A2.0') as CartridgeType,
    status: normalizeStatus(row.status),
    reservedFor: row.reserved_for,
    qcFailReason: row.fail_reason || '',
    receivedDate: row.received_date || '',
    storageLocation: row.storage_location || '',
  };
}

// Reverse mapping: local type → DB row for upsert
export function toDbRow(item: any, productType: string): Record<string, any> {
  const base: Record<string, any> = {
    id: item.id,
    product_type: productType,
    status: item.status,
    notes: item.notes,
    storage_location: item.storageLocation,
    fail_reason: item.failReason || item.qcFailReason || '',
    reserved_for: item.reservedFor || '',
    received_date: item.receivedDate || null,
  };

  if (productType === 'ND2') {
    Object.assign(base, {
      serial_number: item.hntSerialNumber,
      hfl1: item.hfl1, hfl2: item.hfl2,
      hsd1: item.hsd1, hsd2: item.hsd2,
      hrm: item.hrm,
      hrm_sell_or_keep: item.hrmSellOrKeep,
      ups_stabilizer: item.upsStabilizer,
      clinic: item.clinic,
      inspection_doc: item.inspectionDoc,
    });
  } else if (productType === 'TRICA 3D') {
    Object.assign(base, {
      serial_number: item.serialNumber,
      clinic: item.clinic,
      install_date: item.installDate || null,
      borrow_from: item.borrowFrom,
      borrow_to: item.borrowTo,
      email_trica: item.emailTrica,
    });
  } else if (productType === 'CARTRIDGE') {
    Object.assign(base, {
      serial_number: item.serialNumber,
      cartridge_type: item.cartridgeType,
    });
  } else {
    // Quattro, Picohi, Freezero
    Object.assign(base, {
      serial_number: item.serialNumber,
      handpiece: item.handpiece,
    });
  }

  return base;
}

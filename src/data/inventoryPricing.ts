// Inventory pricing store — maps QC Stock item IDs to selling prices
// This acts as an overlay: QC Stock is the source of truth for items,
// this module only adds pricing data.

export interface InventoryPriceEntry {
  itemId: string;
  sellingPrice: number | null;
}

// In-memory pricing map (keyed by item ID from QC Stock)
export const inventoryPrices: Map<string, number | null> = new Map();

export function setPrice(itemId: string, price: number | null) {
  inventoryPrices.set(itemId, price);
}

export function getPrice(itemId: string): number | null {
  return inventoryPrices.get(itemId) ?? null;
}

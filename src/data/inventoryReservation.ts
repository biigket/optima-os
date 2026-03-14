// Tracks which QC Stock items are linked to which quotations.
// When a quotation becomes CUSTOMER_SIGNED, items change to ติดจอง.

import { mockND2Stock } from './qcMockData';
import { mockTrica3DStock } from './trica3dMockData';
import { mockQuattroStock } from './quattroMockData';
import { mockCartridgeStock } from './cartridgeMockData';
import type { UnifiedStockStatus } from './unifiedStockStatus';
import { supabase } from '@/integrations/supabase/client';

export interface ReservationEntry {
  quotationId: string;
  inventoryItemIds: string[];
}

// In-memory store: quotation ID → inventory item IDs
const reservations: Map<string, string[]> = new Map();

export function addReservation(quotationId: string, itemIds: string[]) {
  reservations.set(quotationId, itemIds);
}

export function getReservation(quotationId: string): string[] {
  return reservations.get(quotationId) ?? [];
}

export function getAllReservations(): Map<string, string[]> {
  return reservations;
}

// Find the item in any of the mock arrays and update its status
function updateItemStatus(itemId: string, status: UnifiedStockStatus, reservedFor?: string) {
  const nd2 = mockND2Stock.find(i => i.id === itemId);
  if (nd2) { nd2.status = status; if (reservedFor) nd2.reservedFor = reservedFor; return; }

  const trica = mockTrica3DStock.find(i => i.id === itemId);
  if (trica) { trica.status = status; if (reservedFor) trica.reservedFor = reservedFor; return; }

  const quattro = mockQuattroStock.find(i => i.id === itemId);
  if (quattro) { quattro.status = status; if (reservedFor) quattro.reservedFor = reservedFor; return; }

  const cart = mockCartridgeStock.find(i => i.id === itemId);
  if (cart) { cart.status = status; if (reservedFor) cart.reservedFor = reservedFor; return; }
}

// Sync: check all tracked quotations, if CUSTOMER_SIGNED → items become ติดจอง
export async function syncReservations() {
  const quotationIds = Array.from(reservations.keys());
  if (quotationIds.length === 0) return;

  const { data: quotations } = await supabase
    .from('quotations')
    .select('id, approval_status, qt_number')
    .in('id', quotationIds);

  if (!quotations) return;

  for (const qt of quotations) {
    const itemIds = reservations.get(qt.id);
    if (!itemIds) continue;

    if (qt.approval_status === 'CUSTOMER_SIGNED') {
      for (const itemId of itemIds) {
        updateItemStatus(itemId, 'ติดจอง', qt.qt_number || undefined);
      }
    }
  }
}

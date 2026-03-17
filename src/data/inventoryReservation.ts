// Tracks which QC Stock items are linked to which quotations.
// When a quotation becomes CUSTOMER_SIGNED, items change to ติดจอง.

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

// Sync: check all tracked quotations, if CUSTOMER_SIGNED → items become ติดจอง in DB
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
        await supabase
          .from('qc_stock_items')
          .update({ status: 'ติดจอง', reserved_for: qt.qt_number || '' })
          .eq('id', itemId);
      }
    }
  }
}

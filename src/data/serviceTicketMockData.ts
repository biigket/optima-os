// Service Ticket mock data

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_PART' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketItemType = 'DEVICE' | 'CONSUMABLE';

export interface ServiceTicketUpdate {
  id: string;
  ticketId: string;
  message: string;
  photos: string[];
  updatedBy: string;
  newStatus?: TicketStatus;
  createdAt: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  accountId: string;
  clinic: string;
  // linked item
  itemType: TicketItemType;
  itemId: string; // installation id or consumable id
  itemName: string; // e.g. "ND2 - SN: xxx" or "A2.0 - SN: xxx"
  serialNumber: string;
  // symptom
  symptom: string;
  symptomPhotos: string[];
  // management
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string;
  resolution: string;
  // timestamps
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  // updates log
  updates: ServiceTicketUpdate[];
}

export const mockServiceTickets: ServiceTicket[] = [];

let ticketCounter = 0;
export function getNextTicketNumber(): string {
  ticketCounter++;
  return `SR-2026-${String(ticketCounter).padStart(4, '0')}`;
}

export const ticketStatusLabels: Record<TicketStatus, string> = {
  OPEN: 'เปิด',
  IN_PROGRESS: 'กำลังดำเนินการ',
  WAITING_PART: 'รออะไหล่',
  RESOLVED: 'แก้ไขแล้ว',
  CLOSED: 'ปิด',
};

export const ticketStatusColors: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  WAITING_PART: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-muted text-muted-foreground',
};

export const ticketPriorityLabels: Record<TicketPriority, string> = {
  LOW: 'ต่ำ',
  NORMAL: 'ปกติ',
  HIGH: 'สูง',
  URGENT: 'เร่งด่วน',
};

export const ticketPriorityColors: Record<TicketPriority, string> = {
  LOW: 'bg-muted text-muted-foreground',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-destructive/10 text-destructive',
};

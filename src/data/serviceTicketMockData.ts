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

export const mockServiceTickets: ServiceTicket[] = [
  {
    id: 'st-1',
    ticketNumber: 'SR-2026-0001',
    accountId: '',
    clinic: 'KRM Clinic',
    itemType: 'DEVICE',
    itemId: 'inst-1',
    itemName: 'ND2',
    serialNumber: 'ND2-2024-001',
    symptom: 'หน้าจอกะพริบเป็นระยะ ใช้งานได้ไม่สะดวก',
    symptomPhotos: [],
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'Tanaka Yuki',
    resolution: '',
    createdAt: '2026-03-10T09:00:00',
    updatedAt: '2026-03-12T14:30:00',
    updates: [
      {
        id: 'stu-1',
        ticketId: 'st-1',
        message: 'รับเรื่องแล้ว จะนัดเข้าตรวจสอบภายในสัปดาห์',
        photos: [],
        updatedBy: 'Tanaka Yuki',
        newStatus: 'IN_PROGRESS',
        createdAt: '2026-03-10T10:00:00',
      },
      {
        id: 'stu-2',
        ticketId: 'st-1',
        message: 'ตรวจสอบแล้ว พบว่าสาย LCD หลวม กำลังสั่งอะไหล่',
        photos: [],
        updatedBy: 'Tanaka Yuki',
        newStatus: 'WAITING_PART',
        createdAt: '2026-03-12T14:30:00',
      },
    ],
  },
  {
    id: 'st-2',
    ticketNumber: 'SR-2026-0002',
    accountId: '',
    clinic: 'A-listic clinic',
    itemType: 'CONSUMABLE',
    itemId: 'cons-2',
    itemName: 'Cartridge A2.0',
    serialNumber: 'FLA225110053',
    symptom: 'ยิงแล้วมีเสียงดังผิดปกติ และความแรงลดลง',
    symptomPhotos: [],
    status: 'OPEN',
    priority: 'NORMAL',
    assignedTo: 'Tanaka Yuki',
    resolution: '',
    createdAt: '2026-03-14T11:00:00',
    updatedAt: '2026-03-14T11:00:00',
    updates: [],
  },
  {
    id: 'st-3',
    ticketNumber: 'SR-2026-0003',
    accountId: '',
    clinic: 'Dr.Orawan clinic',
    itemType: 'DEVICE',
    itemId: 'inst-2',
    itemName: 'Trica 3D',
    serialNumber: 'T3D-2024-002',
    symptom: 'เครื่องไม่สามารถเปิดได้ ไฟไม่ติด',
    symptomPhotos: [],
    status: 'RESOLVED',
    priority: 'URGENT',
    assignedTo: 'Tanaka Yuki',
    resolution: 'เปลี่ยน Power Supply ใหม่ เครื่องกลับมาทำงานปกติ',
    createdAt: '2026-03-01T08:00:00',
    updatedAt: '2026-03-05T16:00:00',
    closedAt: '2026-03-05T16:00:00',
    updates: [
      {
        id: 'stu-3',
        ticketId: 'st-3',
        message: 'ตรวจสอบแล้วพบว่า Power Supply เสีย',
        photos: [],
        updatedBy: 'Tanaka Yuki',
        newStatus: 'IN_PROGRESS',
        createdAt: '2026-03-02T10:00:00',
      },
      {
        id: 'stu-4',
        ticketId: 'st-3',
        message: 'เปลี่ยน Power Supply แล้ว เครื่องทำงานปกติ',
        photos: [],
        updatedBy: 'Tanaka Yuki',
        newStatus: 'RESOLVED',
        createdAt: '2026-03-05T16:00:00',
      },
    ],
  },
];

let ticketCounter = 3;
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

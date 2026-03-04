// === ENUMS ===

export type CustomerStatus = 'PROSPECT' | 'CUSTOMER' | 'DORMANT';
export type OpportunityType = 'NEW_DEVICE' | 'CONSUMABLE_REPEAT' | 'UPSELL' | 'SERVICE_CONTRACT';
export type OpportunityStage = 'NEW' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'DEMO_DONE' | 'NEGOTIATION' | 'WON' | 'LOST';

export type WorkItemType = 'CONTACT' | 'FOLLOW_UP' | 'DEMO_PREP' | 'DEMO_EVENT' | 'SERVICE_PREP' | 'SHIPMENT' | 'INSTALLATION' | 'SERVICE_TICKET' | 'FINANCE_DOC' | 'CONSUMABLE_ORDER' | 'MARKETING_TASK';
export type Department = 'SALES' | 'PRODUCT' | 'SERVICE' | 'STOCK' | 'FINANCE' | 'MARKETING';
export type WorkItemStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type OrderType = 'DEVICE' | 'CONSUMABLE' | 'SERVICE';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'FULFILLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type ShippingStatus = 'DRAFT' | 'RESERVED' | 'SHIPPED' | 'DELIVERED';
export type InventoryCategory = 'DEVICE' | 'CONSUMABLE' | 'PART';
export type InventoryStatus = 'AVAILABLE' | 'RESERVED' | 'OUT';
export type DocType = 'QUOTATION' | 'INVOICE' | 'RECEIPT' | 'PO' | 'OTHER';
export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type UserRole = 'SUPER_ADMIN' | 'HEAD_OF_DEPARTMENT' | 'STAFF';

// === ENTITIES ===

export interface Account {
  accountId: string;
  clinicName: string;
  province: string;
  address: string;
  customerStatus: CustomerStatus;
  assignedSalesOwnerUserId: string;
}

export interface Contact {
  contactId: string;
  accountId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  lineId?: string;
}

export interface Opportunity {
  opportunityId: string;
  accountId: string;
  opportunityType: OpportunityType;
  stage: OpportunityStage;
  ownerUserId: string;
  expectedValue: number;
  closeDate: string;
}

export interface WorkItem {
  workItemId: string;
  type: WorkItemType;
  departmentOwner: Department;
  linkedAccountId: string;
  linkedOpportunityId?: string;
  assigneeUserId: string;
  status: WorkItemStatus;
  priority: Priority;
  dueDateTime: string;
  location?: string;
  metadata?: Record<string, unknown>;
  title: string;
}

export interface ActivityLog {
  activityId: string;
  linkedAccountId: string;
  linkedOpportunityId?: string;
  linkedWorkItemId?: string;
  actionType: string;
  message: string;
  performedByUserId: string;
  performedAt: string;
}

export interface CalendarEvent {
  calendarEventId: string;
  linkedWorkItemId: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  ownerUserId: string;
  departmentOwner: Department;
}

export interface SalesOrder {
  salesOrderId: string;
  accountId: string;
  opportunityId: string;
  orderType: OrderType;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface Shipment {
  shipmentId: string;
  salesOrderId: string;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  shipToAddress: string;
}

export interface InventoryItem {
  inventoryId: string;
  productName: string;
  category: InventoryCategory;
  serialNumber?: string;
  quantity: number;
  warehouseLocation: string;
  status: InventoryStatus;
}

export interface FinanceDocument {
  financeDocId: string;
  salesOrderId: string;
  docType: DocType;
  issueDate: string;
  dueDate: string;
  amount: number;
  paymentStatus: PaymentStatus;
  approvalStatus: ApprovalStatus;
  fileUrl?: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  avatarUrl?: string;
}

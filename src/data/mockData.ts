import type { Account, Contact, Opportunity, Quotation, Profile } from '@/types';

// Legacy types for mock data that haven't migrated to DB yet
export interface WorkItem {
  workItemId: string; type: string; departmentOwner: string; linkedAccountId: string;
  linkedOpportunityId?: string; assigneeUserId: string; status: string; priority: string;
  dueDateTime: string; location?: string; title: string;
}
export interface ActivityLog {
  activityId: string; linkedAccountId: string; linkedOpportunityId?: string;
  linkedWorkItemId?: string; actionType: string; message: string;
  performedByUserId: string; performedAt: string;
}
export interface CalendarEvent {
  calendarEventId: string; linkedWorkItemId: string; title: string;
  startDateTime: string; endDateTime: string; location?: string;
  ownerUserId: string; departmentOwner: string;
}
export interface SalesOrder {
  salesOrderId: string; accountId: string; opportunityId: string;
  orderType: string; orderStatus: string; paymentStatus: string;
}
export interface InventoryItem {
  inventoryId: string; productName: string; category: string;
  serialNumber?: string; quantity: number; warehouseLocation: string; status: string;
}
export interface FinanceDocument {
  financeDocId: string; salesOrderId: string; docType: string;
  issueDate: string; dueDate: string; amount: number;
  paymentStatus: string; approvalStatus: string;
}
export interface MockUser {
  userId: string; name: string; email: string; role: string;
  department: string; avatarUrl?: string;
}
export interface MockInvoice {
  invoiceId: string; accountId: string; salesOrderId: string;
  amount: number; issueDate: string; dueDate: string;
  paymentStatus: string; approvalStatus: string;
}

export const mockUsers: MockUser[] = [
  { userId: 'u1', name: 'Somchai Patel', email: 'somchai@optima.co', role: 'SUPER_ADMIN', department: 'SALES', avatarUrl: '' },
  { userId: 'u2', name: 'Narin Lee', email: 'narin@optima.co', role: 'HEAD_OF_DEPARTMENT', department: 'SALES' },
  { userId: 'u3', name: 'Priya Sharma', email: 'priya@optima.co', role: 'STAFF', department: 'PRODUCT' },
  { userId: 'u4', name: 'Tanaka Yuki', email: 'tanaka@optima.co', role: 'STAFF', department: 'SERVICE' },
  { userId: 'u5', name: 'Lisa Chen', email: 'lisa@optima.co', role: 'HEAD_OF_DEPARTMENT', department: 'FINANCE' },
  { userId: 'u6', name: 'Mark Santos', email: 'mark@optima.co', role: 'STAFF', department: 'STOCK' },
];

export const mockAccounts: Account[] = [
  { id: 'a1', clinic_name: 'Glow Aesthetic Clinic', address: '123 Sukhumvit Rd, Bangkok', customer_status: 'PURCHASED', assigned_sale: 'Narin Lee', created_at: '' },
  { id: 'a2', clinic_name: 'Radiance Derma Center', address: '45 Nimmanhaemin Rd, Chiang Mai', customer_status: 'NEW_LEAD', assigned_sale: 'Narin Lee', created_at: '' },
  { id: 'a3', clinic_name: 'Skin Perfect Lab', address: '78 Beach Rd, Phuket', customer_status: 'NEW_LEAD', assigned_sale: 'Narin Lee', created_at: '' },
  { id: 'a4', clinic_name: 'Beauty Plus Clinic', address: '200 Thonglor Soi 10, Bangkok', customer_status: 'PURCHASED', assigned_sale: 'Narin Lee', created_at: '' },
  { id: 'a5', clinic_name: 'Aura Med Spa', address: '55 Walking Street, Pattaya', customer_status: 'DORMANT', assigned_sale: 'Narin Lee', created_at: '' },
];

export const mockContacts: Contact[] = [
  { id: 'c1', account_id: 'a1', name: 'Dr. Apinya Suwannapong', role: 'Medical Director', phone: '+66812345678', email: 'apinya@glow.co', line_id: '@apinya', created_at: '' },
  { id: 'c2', account_id: 'a2', name: 'Dr. Kamol Thongprasert', role: 'Owner', phone: '+66823456789', email: 'kamol@radiance.co', created_at: '' },
  { id: 'c3', account_id: 'a3', name: 'Nurse Ploy Rattanakorn', role: 'Clinic Manager', phone: '+66834567890', email: 'ploy@skinperfect.co', created_at: '' },
];

export const mockProducts = [
  { id: 'p1', name: 'PicoStar Pro Laser', category: 'DEVICE' as const, price: 2500000 },
  { id: 'p2', name: 'HydraGlow Facial System', category: 'DEVICE' as const, price: 1800000 },
  { id: 'p3', name: 'CoolSculpt Body Contouring', category: 'DEVICE' as const, price: 3200000 },
  { id: 'p4', name: 'RF Needle Cartridge (25pin)', category: 'CONSUMABLE' as const, price: 500 },
  { id: 'p5', name: 'HydraGlow Serum Cartridge', category: 'CONSUMABLE' as const, price: 1750 },
  { id: 'p6', name: 'Cryo Gel Pads (Pack of 50)', category: 'CONSUMABLE' as const, price: 2500 },
  { id: 'p7', name: 'Laser Handpiece Tip (532nm)', category: 'CONSUMABLE' as const, price: 8500 },
];

export const mockOpportunities: Opportunity[] = [
  { id: 'o1', account_id: 'a2', stage: 'DEMO_SCHEDULED', opportunity_type: 'DEVICE', expected_value: 2500000, close_date: '2026-04-15', assigned_sale: 'Narin Lee', interested_products: ['HydraGlow Facial System'], next_activity_type: 'DEMO', next_activity_date: '2026-03-10', created_at: '2026-02-20' },
  { id: 'o2', account_id: 'a3', stage: 'CONTACTED', opportunity_type: 'DEVICE', expected_value: 1800000, close_date: '2026-04-30', assigned_sale: 'Narin Lee', interested_products: ['PicoStar Pro Laser'], next_activity_type: 'CALL', next_activity_date: '2026-03-06', created_at: '2026-03-01' },
  { id: 'o3', account_id: 'a1', stage: 'NEGOTIATION', opportunity_type: 'CONSUMABLE', expected_value: 350000, close_date: '2026-03-20', assigned_sale: 'Narin Lee', interested_products: ['Consumables'], quantity: 200, next_activity_type: 'MEETING', next_activity_date: '2026-03-08', created_at: '2026-02-15' },
  { id: 'o4', account_id: 'a4', stage: 'WON', opportunity_type: 'DEVICE', expected_value: 150000, close_date: '2026-02-28', assigned_sale: 'Narin Lee', interested_products: ['Service Contract'], created_at: '2026-01-10' },
  { id: 'o5', account_id: 'a1', stage: 'NEW_LEAD', opportunity_type: 'DEVICE', expected_value: 900000, close_date: '2026-05-15', assigned_sale: 'Narin Lee', interested_products: ['CoolSculpt'], created_at: '2026-02-01' },
  { id: 'o6', account_id: 'a5', stage: 'CONTACTED', opportunity_type: 'CONSUMABLE', expected_value: 85000, close_date: '2026-04-10', assigned_sale: 'Narin Lee', interested_products: ['RF Needle Cartridge (25pin)'], quantity: 100, created_at: '2026-01-15' },
];

export const mockWorkItems: WorkItem[] = [
  { workItemId: 'w1', type: 'DEMO_EVENT', departmentOwner: 'PRODUCT', linkedAccountId: 'a2', linkedOpportunityId: 'o1', assigneeUserId: 'u3', status: 'OPEN', priority: 'HIGH', dueDateTime: '2026-03-10T10:00:00', location: 'Chiang Mai', title: 'Product demo at Radiance Derma' },
  { workItemId: 'w2', type: 'DEMO_PREP', departmentOwner: 'PRODUCT', linkedAccountId: 'a2', linkedOpportunityId: 'o1', assigneeUserId: 'u3', status: 'IN_PROGRESS', priority: 'HIGH', dueDateTime: '2026-03-08T09:00:00', title: 'Prepare demo unit for Radiance' },
  { workItemId: 'w3', type: 'FOLLOW_UP', departmentOwner: 'SALES', linkedAccountId: 'a3', linkedOpportunityId: 'o2', assigneeUserId: 'u2', status: 'OPEN', priority: 'MEDIUM', dueDateTime: '2026-03-06T14:00:00', title: 'Follow up with Skin Perfect Lab' },
  { workItemId: 'w4', type: 'SERVICE_TICKET', departmentOwner: 'SERVICE', linkedAccountId: 'a4', assigneeUserId: 'u4', status: 'IN_PROGRESS', priority: 'URGENT', dueDateTime: '2026-03-05T08:00:00', title: 'Repair laser unit #SN-4421' },
  { workItemId: 'w5', type: 'FINANCE_DOC', departmentOwner: 'FINANCE', linkedAccountId: 'a1', linkedOpportunityId: 'o3', assigneeUserId: 'u5', status: 'OPEN', priority: 'MEDIUM', dueDateTime: '2026-03-07T12:00:00', title: 'Prepare quotation for consumables' },
  { workItemId: 'w6', type: 'SHIPMENT', departmentOwner: 'STOCK', linkedAccountId: 'a4', assigneeUserId: 'u6', status: 'WAITING', priority: 'HIGH', dueDateTime: '2026-03-09T09:00:00', title: 'Ship service contract parts' },
  { workItemId: 'w7', type: 'INSTALLATION', departmentOwner: 'SERVICE', linkedAccountId: 'a1', assigneeUserId: 'u4', status: 'OPEN', priority: 'MEDIUM', dueDateTime: '2026-03-12T10:00:00', location: 'Bangkok', title: 'Install new device at Glow Clinic' },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { calendarEventId: 'ce1', linkedWorkItemId: 'w1', title: 'Demo at Radiance Derma Center', startDateTime: '2026-03-10T10:00:00', endDateTime: '2026-03-10T12:00:00', location: 'Chiang Mai', ownerUserId: 'u3', departmentOwner: 'PRODUCT' },
  { calendarEventId: 'ce2', linkedWorkItemId: 'w7', title: 'Device Installation - Glow Clinic', startDateTime: '2026-03-12T10:00:00', endDateTime: '2026-03-12T15:00:00', location: 'Bangkok', ownerUserId: 'u4', departmentOwner: 'SERVICE' },
  { calendarEventId: 'ce3', linkedWorkItemId: 'w3', title: 'Follow-up Call - Skin Perfect', startDateTime: '2026-03-06T14:00:00', endDateTime: '2026-03-06T14:30:00', ownerUserId: 'u2', departmentOwner: 'SALES' },
];

export const mockActivityLogs: ActivityLog[] = [
  { activityId: 'al1', linkedAccountId: 'a2', linkedOpportunityId: 'o1', actionType: 'DEMO_SCHEDULED', message: 'Demo scheduled at Radiance Derma Center for March 10', performedByUserId: 'u2', performedAt: '2026-03-01T09:00:00' },
  { activityId: 'al2', linkedAccountId: 'a3', linkedOpportunityId: 'o2', actionType: 'CONTACT', message: 'Initial contact made with Skin Perfect Lab', performedByUserId: 'u2', performedAt: '2026-03-01T11:00:00' },
  { activityId: 'al3', linkedAccountId: 'a1', linkedOpportunityId: 'o3', actionType: 'NEGOTIATION', message: 'Consumable pricing negotiation started', performedByUserId: 'u2', performedAt: '2026-03-02T10:00:00' },
  { activityId: 'al4', linkedAccountId: 'a4', actionType: 'SERVICE_TICKET', message: 'Service ticket opened for laser unit repair', performedByUserId: 'u4', performedAt: '2026-03-03T08:00:00' },
  { activityId: 'al5', linkedAccountId: 'a4', linkedOpportunityId: 'o4', actionType: 'DEAL_WON', message: 'Service contract deal closed', performedByUserId: 'u2', performedAt: '2026-02-28T16:00:00' },
];

export const mockInventory: InventoryItem[] = [
  { inventoryId: 'inv1', productName: 'PicoStar Pro Laser', category: 'DEVICE', serialNumber: 'PS-2026-001', quantity: 2, warehouseLocation: 'BKK-A1', status: 'AVAILABLE' },
  { inventoryId: 'inv2', productName: 'HydraGlow Facial System', category: 'DEVICE', serialNumber: 'HG-2026-003', quantity: 1, warehouseLocation: 'BKK-A2', status: 'RESERVED' },
  { inventoryId: 'inv3', productName: 'Laser Handpiece Tip (532nm)', category: 'PART', quantity: 15, warehouseLocation: 'BKK-B1', status: 'AVAILABLE' },
  { inventoryId: 'inv4', productName: 'HydraGlow Serum Cartridge', category: 'CONSUMABLE', quantity: 48, warehouseLocation: 'BKK-B2', status: 'AVAILABLE' },
  { inventoryId: 'inv5', productName: 'PicoStar Calibration Kit', category: 'PART', quantity: 0, warehouseLocation: 'BKK-C1', status: 'OUT' },
  { inventoryId: 'inv6', productName: 'CoolSculpt Body Contouring', category: 'DEVICE', serialNumber: 'CS-2026-002', quantity: 1, warehouseLocation: 'BKK-A3', status: 'AVAILABLE' },
  { inventoryId: 'inv7', productName: 'RF Needle Cartridge (25pin)', category: 'CONSUMABLE', quantity: 120, warehouseLocation: 'BKK-B3', status: 'AVAILABLE' },
  { inventoryId: 'inv8', productName: 'IPL Filter Glass 560nm', category: 'PART', quantity: 3, warehouseLocation: 'BKK-C2', status: 'AVAILABLE' },
  { inventoryId: 'inv9', productName: 'Cryo Gel Pads (Pack of 50)', category: 'CONSUMABLE', quantity: 0, warehouseLocation: 'BKK-B4', status: 'OUT' },
];

export const mockFinanceDocs: FinanceDocument[] = [
  { financeDocId: 'fd1', salesOrderId: 'so1', docType: 'INVOICE', issueDate: '2026-02-28', dueDate: '2026-03-30', amount: 150000, paymentStatus: 'UNPAID', approvalStatus: 'APPROVED' },
  { financeDocId: 'fd2', salesOrderId: 'so1', docType: 'QUOTATION', issueDate: '2026-02-15', dueDate: '2026-03-15', amount: 350000, paymentStatus: 'UNPAID', approvalStatus: 'SUBMITTED' },
];

export const mockQuotations: Quotation[] = [
  { id: 'QT-2026-001', qt_number: 'QT-2026-001', account_id: 'a1', product: 'PicoStar Pro Laser', price: 2500000, qt_date: '2026-02-20', payment_status: 'UNPAID', approval_status: 'APPROVED', sale_assigned: 'Narin Lee', created_at: '' },
  { id: 'QT-2026-002', qt_number: 'QT-2026-002', account_id: 'a2', product: 'HydraGlow Facial System', price: 1835000, qt_date: '2026-03-01', payment_status: 'UNPAID', approval_status: 'SUBMITTED', sale_assigned: 'Narin Lee', created_at: '' },
  { id: 'QT-2026-003', qt_number: 'QT-2026-003', account_id: 'a3', product: 'RF Needle Cartridge (25pin)', price: 60000, qt_date: '2026-03-03', payment_status: 'UNPAID', approval_status: 'DRAFT', sale_assigned: 'Narin Lee', created_at: '' },
  { id: 'QT-2026-004', qt_number: 'QT-2026-004', account_id: 'a4', product: 'CoolSculpt Body Contouring', price: 3200000, qt_date: '2026-02-10', payment_status: 'UNPAID', approval_status: 'REJECTED', sale_assigned: 'Narin Lee', created_at: '' },
  { id: 'QT-2026-005', qt_number: 'QT-2026-005', account_id: 'a1', product: 'HydraGlow Serum Cartridge', price: 84000, qt_date: '2026-03-04', payment_status: 'UNPAID', approval_status: 'DRAFT', sale_assigned: 'Lisa Chen', created_at: '' },
];

export const mockSalesOrders: SalesOrder[] = [
  { salesOrderId: 'SO-2026-001', accountId: 'a1', opportunityId: 'o3', orderType: 'CONSUMABLE', orderStatus: 'CONFIRMED', paymentStatus: 'PARTIAL' },
  { salesOrderId: 'SO-2026-002', accountId: 'a4', opportunityId: 'o4', orderType: 'SERVICE', orderStatus: 'FULFILLED', paymentStatus: 'PAID' },
  { salesOrderId: 'SO-2026-003', accountId: 'a2', opportunityId: 'o1', orderType: 'DEVICE', orderStatus: 'DRAFT', paymentStatus: 'UNPAID' },
  { salesOrderId: 'SO-2026-004', accountId: 'a1', opportunityId: 'o5', orderType: 'DEVICE', orderStatus: 'CONFIRMED', paymentStatus: 'UNPAID' },
];

export const mockInvoices: MockInvoice[] = [
  { invoiceId: 'INV-2026-001', accountId: 'a1', salesOrderId: 'SO-2026-001', amount: 175000, issueDate: '2026-02-28', dueDate: '2026-03-30', paymentStatus: 'UNPAID', approvalStatus: 'APPROVED' },
  { invoiceId: 'INV-2026-002', accountId: 'a4', salesOrderId: 'SO-2026-002', amount: 150000, issueDate: '2026-02-28', dueDate: '2026-03-15', paymentStatus: 'PAID', approvalStatus: 'APPROVED' },
  { invoiceId: 'INV-2026-003', accountId: 'a2', salesOrderId: 'SO-2026-003', amount: 1835000, issueDate: '2026-03-05', dueDate: '2026-04-05', paymentStatus: 'UNPAID', approvalStatus: 'DRAFT' },
  { invoiceId: 'INV-2026-004', accountId: 'a1', salesOrderId: 'SO-2026-004', amount: 900000, issueDate: '2026-03-04', dueDate: '2026-04-04', paymentStatus: 'PARTIAL', approvalStatus: 'APPROVED' },
];

// Helpers
export function getAccountById(id: string) { return mockAccounts.find(a => a.id === id); }
export function getUserById(id: string) { return mockUsers.find(u => u.userId === id); }
export function getWorkItemsForAccount(accountId: string) { return mockWorkItems.filter(w => w.linkedAccountId === accountId); }
export function getOpportunitiesForAccount(accountId: string) { return mockOpportunities.filter(o => o.account_id === accountId); }
export function getContactsForAccount(accountId: string) { return mockContacts.filter(c => c.account_id === accountId); }
export function getActivitiesForAccount(accountId: string) { return mockActivityLogs.filter(a => a.linkedAccountId === accountId); }

import type { Account, Contact, Opportunity, WorkItem, ActivityLog, CalendarEvent, SalesOrder, InventoryItem, FinanceDocument, User } from '@/types';

export const mockUsers: User[] = [
  { userId: 'u1', name: 'Somchai Patel', email: 'somchai@optima.co', role: 'SUPER_ADMIN', department: 'SALES', avatarUrl: '' },
  { userId: 'u2', name: 'Narin Lee', email: 'narin@optima.co', role: 'HEAD_OF_DEPARTMENT', department: 'SALES' },
  { userId: 'u3', name: 'Priya Sharma', email: 'priya@optima.co', role: 'STAFF', department: 'PRODUCT' },
  { userId: 'u4', name: 'Tanaka Yuki', email: 'tanaka@optima.co', role: 'STAFF', department: 'SERVICE' },
  { userId: 'u5', name: 'Lisa Chen', email: 'lisa@optima.co', role: 'HEAD_OF_DEPARTMENT', department: 'FINANCE' },
  { userId: 'u6', name: 'Mark Santos', email: 'mark@optima.co', role: 'STAFF', department: 'STOCK' },
];

export const mockAccounts: Account[] = [
  { accountId: 'a1', clinicName: 'Glow Aesthetic Clinic', province: 'Bangkok', address: '123 Sukhumvit Rd', customerStatus: 'CUSTOMER', assignedSalesOwnerUserId: 'u2' },
  { accountId: 'a2', clinicName: 'Radiance Derma Center', province: 'Chiang Mai', address: '45 Nimmanhaemin Rd', customerStatus: 'PROSPECT', assignedSalesOwnerUserId: 'u2' },
  { accountId: 'a3', clinicName: 'Skin Perfect Lab', province: 'Phuket', address: '78 Beach Rd', customerStatus: 'PROSPECT', assignedSalesOwnerUserId: 'u2' },
  { accountId: 'a4', clinicName: 'Beauty Plus Clinic', province: 'Bangkok', address: '200 Thonglor Soi 10', customerStatus: 'CUSTOMER', assignedSalesOwnerUserId: 'u2' },
  { accountId: 'a5', clinicName: 'Aura Med Spa', province: 'Pattaya', address: '55 Walking Street', customerStatus: 'DORMANT', assignedSalesOwnerUserId: 'u2' },
];

export const mockContacts: Contact[] = [
  { contactId: 'c1', accountId: 'a1', name: 'Dr. Apinya Suwannapong', role: 'Medical Director', phone: '+66812345678', email: 'apinya@glow.co', lineId: '@apinya' },
  { contactId: 'c2', accountId: 'a2', name: 'Dr. Kamol Thongprasert', role: 'Owner', phone: '+66823456789', email: 'kamol@radiance.co' },
  { contactId: 'c3', accountId: 'a3', name: 'Nurse Ploy Rattanakorn', role: 'Clinic Manager', phone: '+66834567890', email: 'ploy@skinperfect.co' },
];

export const mockOpportunities: Opportunity[] = [
  { opportunityId: 'o1', accountId: 'a2', opportunityType: 'NEW_DEVICE', stage: 'DEMO_SCHEDULED', ownerUserId: 'u2', expectedValue: 2500000, closeDate: '2026-04-15' },
  { opportunityId: 'o2', accountId: 'a3', opportunityType: 'NEW_DEVICE', stage: 'CONTACTED', ownerUserId: 'u2', expectedValue: 1800000, closeDate: '2026-04-30' },
  { opportunityId: 'o3', accountId: 'a1', opportunityType: 'CONSUMABLE_REPEAT', stage: 'NEGOTIATION', ownerUserId: 'u2', expectedValue: 350000, closeDate: '2026-03-20' },
  { opportunityId: 'o4', accountId: 'a4', opportunityType: 'SERVICE_CONTRACT', stage: 'WON', ownerUserId: 'u2', expectedValue: 150000, closeDate: '2026-02-28' },
  { opportunityId: 'o5', accountId: 'a1', opportunityType: 'UPSELL', stage: 'NEW', ownerUserId: 'u2', expectedValue: 900000, closeDate: '2026-05-15' },
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
];

export const mockFinanceDocs: FinanceDocument[] = [
  { financeDocId: 'fd1', salesOrderId: 'so1', docType: 'INVOICE', issueDate: '2026-02-28', dueDate: '2026-03-30', amount: 150000, paymentStatus: 'UNPAID', approvalStatus: 'APPROVED' },
  { financeDocId: 'fd2', salesOrderId: 'so1', docType: 'QUOTATION', issueDate: '2026-02-15', dueDate: '2026-03-15', amount: 350000, paymentStatus: 'UNPAID', approvalStatus: 'SUBMITTED' },
];

// Helpers
export function getAccountById(id: string) { return mockAccounts.find(a => a.accountId === id); }
export function getUserById(id: string) { return mockUsers.find(u => u.userId === id); }
export function getWorkItemsForAccount(accountId: string) { return mockWorkItems.filter(w => w.linkedAccountId === accountId); }
export function getOpportunitiesForAccount(accountId: string) { return mockOpportunities.filter(o => o.accountId === accountId); }
export function getContactsForAccount(accountId: string) { return mockContacts.filter(c => c.accountId === accountId); }
export function getActivitiesForAccount(accountId: string) { return mockActivityLogs.filter(a => a.linkedAccountId === accountId); }

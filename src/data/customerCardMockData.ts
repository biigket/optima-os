// Customer Card types — data now comes from Supabase

export interface InstalledDevice {
  id: string;
  accountId: string;
  deviceName: string;
  serialNumber: string;
  installDate: string;
  warrantyExpiry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REPAIR';
  engineer: string;
}

export interface ConsumableUsage {
  id: string;
  accountId: string;
  cartridgeType: string;
  totalUsed: number;
  lastOrderDate: string;
  estimatedReorderDate: string;
  unitPrice: number;
}

export interface ServiceRecord {
  id: string;
  accountId: string;
  type: 'PM' | 'REPAIR' | 'SOFTWARE_UPDATE';
  date: string;
  engineer: string;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
}

export interface VisitRecord {
  id: string;
  accountId: string;
  date: string;
  salesPerson: string;
  purpose: string;
  summary: string;
  nextStep: string;
}

export interface PurchaseRecord {
  id: string;
  accountId: string;
  product: string;
  price: number;
  invoiceDate: string;
  salesOwner: string;
}

export interface DocumentRecord {
  id: string;
  accountId: string;
  docType: 'CONTRACT' | 'QUOTATION' | 'INVOICE' | 'PM_REPORT' | 'CERTIFICATE';
  fileName: string;
  uploadDate: string;
}

export interface MarketingRecord {
  id: string;
  accountId: string;
  campaignName: string;
  type: 'CAMPAIGN' | 'AD_SUPPORT' | 'INFLUENCER';
  date: string;
  status: 'JOINED' | 'INVITED' | 'COMPLETED';
}

export interface VisitReportRecord {
  id: string;
  accountId: string;
  date: string;
  doctorFeedback: string;
  competitorMentioned: string;
  objections: string;
  interestLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TimelineEvent {
  id: string;
  accountId: string;
  date: string;
  user: string;
  type: 'VISIT' | 'CALL' | 'DEMO' | 'MEETING' | 'PROPOSAL' | 'SERVICE' | 'TRAINING';
  description: string;
}

// All functions now return empty — data is fetched from Supabase in components
export function getDevicesForAccount(_accountId: string): InstalledDevice[] { return []; }
export function getConsumablesForAccount(_accountId: string): ConsumableUsage[] { return []; }
export function getServiceForAccount(_accountId: string): ServiceRecord[] { return []; }
export function getVisitsForAccount(_accountId: string): VisitRecord[] { return []; }
export function getPurchasesForAccount(_accountId: string): PurchaseRecord[] { return []; }
export function getDocumentsForAccount(_accountId: string): DocumentRecord[] { return []; }
export function getMarketingForAccount(_accountId: string): MarketingRecord[] { return []; }
export function getReportsForAccount(_accountId: string): VisitReportRecord[] { return []; }
export function getTimelineForAccount(_accountId: string): TimelineEvent[] { return []; }
export function getLifetimeRevenue(_accountId: string): number { return 0; }

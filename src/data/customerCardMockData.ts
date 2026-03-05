// Mock data for Customer Card panels — linked by account_id

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

export const mockInstalledDevices: InstalledDevice[] = [
  { id: 'd1', accountId: '1', deviceName: 'Doublo Gold', serialNumber: 'DG-2025-0891', installDate: '2025-08-15', warrantyExpiry: '2026-08-15', status: 'ACTIVE', engineer: 'ช่างวิทย์' },
  { id: 'd2', accountId: '1', deviceName: 'Sciton moxi', serialNumber: 'SM-2025-1234', installDate: '2025-11-01', warrantyExpiry: '2026-11-01', status: 'ACTIVE', engineer: 'ช่างวิทย์' },
  { id: 'd3', accountId: '2', deviceName: 'Doublo Gold', serialNumber: 'DG-2025-0455', installDate: '2025-06-20', warrantyExpiry: '2026-06-20', status: 'ACTIVE', engineer: 'ช่างสมศักดิ์' },
  { id: 'd4', accountId: '4', deviceName: 'Ultraformer MPT', serialNumber: 'UF-2024-7712', installDate: '2024-12-10', warrantyExpiry: '2025-12-10', status: 'UNDER_REPAIR', engineer: 'ช่างวิทย์' },
  { id: 'd5', accountId: '7', deviceName: 'Doublo Gold', serialNumber: 'DG-2025-1100', installDate: '2025-09-05', warrantyExpiry: '2026-09-05', status: 'ACTIVE', engineer: 'ช่างสมศักดิ์' },
  { id: 'd6', accountId: '7', deviceName: 'Picocare 450', serialNumber: 'PC-2025-0332', installDate: '2025-10-20', warrantyExpiry: '2026-10-20', status: 'ACTIVE', engineer: 'ช่างวิทย์' },
];

export const mockConsumableUsage: ConsumableUsage[] = [
  { id: 'cu1', accountId: '1', cartridgeType: 'Doublo 4.5mm Cartridge', totalUsed: 120, lastOrderDate: '2026-02-10', estimatedReorderDate: '2026-04-10', unitPrice: 3500 },
  { id: 'cu2', accountId: '1', cartridgeType: 'Doublo 3.0mm Cartridge', totalUsed: 85, lastOrderDate: '2026-02-10', estimatedReorderDate: '2026-04-15', unitPrice: 3500 },
  { id: 'cu3', accountId: '2', cartridgeType: 'Doublo 4.5mm Cartridge', totalUsed: 200, lastOrderDate: '2026-01-25', estimatedReorderDate: '2026-03-25', unitPrice: 3500 },
  { id: 'cu4', accountId: '4', cartridgeType: 'Ultraformer Cartridge 3.0mm', totalUsed: 60, lastOrderDate: '2025-11-15', estimatedReorderDate: '2026-02-15', unitPrice: 4200 },
  { id: 'cu5', accountId: '7', cartridgeType: 'Doublo 4.5mm Cartridge', totalUsed: 95, lastOrderDate: '2026-02-28', estimatedReorderDate: '2026-05-01', unitPrice: 3500 },
];

export const mockServiceRecords: ServiceRecord[] = [
  { id: 'sr1', accountId: '1', type: 'PM', date: '2026-02-01', engineer: 'ช่างวิทย์', description: 'PM ครั้งที่ 2 — เครื่อง Doublo Gold ทำงานปกติ', status: 'COMPLETED' },
  { id: 'sr2', accountId: '1', type: 'SOFTWARE_UPDATE', date: '2026-01-15', engineer: 'ช่างวิทย์', description: 'อัปเดต firmware v3.2', status: 'COMPLETED' },
  { id: 'sr3', accountId: '2', type: 'PM', date: '2026-01-20', engineer: 'ช่างสมศักดิ์', description: 'PM ครั้งที่ 3 — ปกติ', status: 'COMPLETED' },
  { id: 'sr4', accountId: '4', type: 'REPAIR', date: '2026-03-01', engineer: 'ช่างวิทย์', description: 'ซ่อม handpiece — รอะไหล่', status: 'IN_PROGRESS' },
  { id: 'sr5', accountId: '7', type: 'PM', date: '2026-02-15', engineer: 'ช่างสมศักดิ์', description: 'PM ครั้งที่ 1 — ปกติ', status: 'COMPLETED' },
];

export const mockVisitRecords: VisitRecord[] = [
  { id: 'vr1', accountId: '1', date: '2026-02-28', salesPerson: 'FORD', purpose: 'เยี่ยมลูกค้า', summary: 'แพทย์พอใจกับ Doublo Gold สนใจสั่ง cartridge เพิ่ม', nextStep: 'ส่งใบเสนอราคา cartridge' },
  { id: 'vr2', accountId: '1', date: '2026-02-15', salesPerson: 'FORD', purpose: 'ติดตามผลการใช้งาน', summary: 'เครื่องทำงานดี ลูกค้าชอบผลลัพธ์', nextStep: 'นัด PM ครั้งถัดไป' },
  { id: 'vr3', accountId: '2', date: '2026-03-01', salesPerson: 'VARN', purpose: 'เสนอเครื่องใหม่', summary: 'แพทย์สนใจ Sciton moxi ขอ demo', nextStep: 'นัด demo สัปดาห์หน้า' },
  { id: 'vr4', accountId: '3', date: '2026-03-04', salesPerson: 'PETCH', purpose: 'แนะนำตัว', summary: 'พบผู้จัดการคลินิก สนใจ Doublo', nextStep: 'ส่งโบรชัวร์และราคา' },
  { id: 'vr5', accountId: '4', date: '2026-02-20', salesPerson: 'FAH', purpose: 'ติดตามงานซ่อม', summary: 'กำลังรออะไหล่ คาดว่าจะเสร็จ 2 สัปดาห์', nextStep: 'โทรอัปเดตสถานะ' },
  { id: 'vr6', accountId: '5', date: '2026-03-03', salesPerson: 'VI', purpose: 'ติดต่อครั้งแรก', summary: 'แพทย์สนใจเครื่อง HIFU ขอข้อมูลเพิ่ม', nextStep: 'ส่งเอกสารทาง LINE' },
];

export const mockPurchaseRecords: PurchaseRecord[] = [
  { id: 'pr1', accountId: '1', product: 'Doublo Gold', price: 2800000, invoiceDate: '2025-08-10', salesOwner: 'FORD' },
  { id: 'pr2', accountId: '1', product: 'Sciton moxi', price: 3500000, invoiceDate: '2025-10-25', salesOwner: 'FORD' },
  { id: 'pr3', accountId: '1', product: 'Doublo Cartridge (40 ชิ้น)', price: 140000, invoiceDate: '2026-02-10', salesOwner: 'FORD' },
  { id: 'pr4', accountId: '2', product: 'Doublo Gold', price: 2800000, invoiceDate: '2025-06-15', salesOwner: 'VARN' },
  { id: 'pr5', accountId: '4', product: 'Ultraformer MPT', price: 3200000, invoiceDate: '2024-12-01', salesOwner: 'FAH' },
  { id: 'pr6', accountId: '7', product: 'Doublo Gold', price: 2800000, invoiceDate: '2025-09-01', salesOwner: 'PETCH' },
  { id: 'pr7', accountId: '7', product: 'Picocare 450', price: 4500000, invoiceDate: '2025-10-15', salesOwner: 'PETCH' },
];

export const mockDocuments: DocumentRecord[] = [
  { id: 'doc1', accountId: '1', docType: 'CONTRACT', fileName: 'สัญญาซื้อขาย Doublo Gold.pdf', uploadDate: '2025-08-10' },
  { id: 'doc2', accountId: '1', docType: 'INVOICE', fileName: 'INV-2025-0891.pdf', uploadDate: '2025-08-10' },
  { id: 'doc3', accountId: '1', docType: 'PM_REPORT', fileName: 'PM Report #2 - Feb 2026.pdf', uploadDate: '2026-02-01' },
  { id: 'doc4', accountId: '2', docType: 'CONTRACT', fileName: 'สัญญาซื้อขาย Doublo Gold.pdf', uploadDate: '2025-06-15' },
  { id: 'doc5', accountId: '4', docType: 'QUOTATION', fileName: 'QT-2024-7712.pdf', uploadDate: '2024-11-20' },
  { id: 'doc6', accountId: '7', docType: 'CONTRACT', fileName: 'สัญญาซื้อขาย Doublo + Picocare.pdf', uploadDate: '2025-09-01' },
];

export const mockMarketingRecords: MarketingRecord[] = [
  { id: 'mk1', accountId: '1', campaignName: 'Doublo Gold Masterclass 2025', type: 'CAMPAIGN', date: '2025-11-15', status: 'COMPLETED' },
  { id: 'mk2', accountId: '1', campaignName: 'KOL Partnership Program', type: 'INFLUENCER', date: '2026-01-10', status: 'JOINED' },
  { id: 'mk3', accountId: '2', campaignName: 'Doublo Gold Masterclass 2025', type: 'CAMPAIGN', date: '2025-11-15', status: 'COMPLETED' },
  { id: 'mk4', accountId: '7', campaignName: 'Ad Co-op Program Q1/2026', type: 'AD_SUPPORT', date: '2026-01-01', status: 'JOINED' },
];

export const mockVisitReports: VisitReportRecord[] = [
  { id: 'rp1', accountId: '1', date: '2026-02-28', doctorFeedback: 'พอใจกับผลลัพธ์ Doublo Gold มาก ลูกค้าคลินิกให้ feedback ดี', competitorMentioned: 'Ultraformer III', objections: 'ราคา cartridge ค่อนข้างสูง', interestLevel: 'HIGH' },
  { id: 'rp2', accountId: '2', date: '2026-03-01', doctorFeedback: 'สนใจเพิ่มเครื่องใหม่ กำลังเปรียบเทียบ Sciton กับ Fotona', competitorMentioned: 'Fotona StarWalker', objections: 'ต้องการ demo ก่อนตัดสินใจ', interestLevel: 'MEDIUM' },
  { id: 'rp3', accountId: '3', date: '2026-03-04', doctorFeedback: 'เพิ่งเปิดคลินิก สนใจเครื่อง HIFU', competitorMentioned: '-', objections: 'งบประมาณจำกัด', interestLevel: 'MEDIUM' },
  { id: 'rp4', accountId: '5', date: '2026-03-03', doctorFeedback: 'มีเครื่องคู่แข่งอยู่แล้ว แต่ไม่พอใจผลลัพธ์', competitorMentioned: 'Ultherapy', objections: 'ต้องการเห็น clinical data', interestLevel: 'HIGH' },
];

export const mockTimelineEvents: TimelineEvent[] = [
  { id: 'tl1', accountId: '1', date: '2026-02-28', user: 'FORD', type: 'VISIT', description: 'เยี่ยมคลินิก — แพทย์สนใจสั่ง cartridge เพิ่ม' },
  { id: 'tl2', accountId: '1', date: '2026-02-15', user: 'FORD', type: 'VISIT', description: 'ติดตามผลการใช้งาน Doublo Gold' },
  { id: 'tl3', accountId: '1', date: '2026-02-01', user: 'ช่างวิทย์', type: 'SERVICE', description: 'PM ครั้งที่ 2 — เครื่อง Doublo Gold' },
  { id: 'tl4', accountId: '1', date: '2026-01-15', user: 'ช่างวิทย์', type: 'SERVICE', description: 'อัปเดต firmware v3.2' },
  { id: 'tl5', accountId: '1', date: '2026-01-10', user: 'FORD', type: 'TRAINING', description: 'จัด training การใช้งาน Sciton moxi' },
  { id: 'tl6', accountId: '1', date: '2025-11-15', user: 'FORD', type: 'MEETING', description: 'ร่วมงาน Doublo Gold Masterclass' },
  { id: 'tl7', accountId: '1', date: '2025-11-01', user: 'FORD', type: 'DEMO', description: 'ส่งมอบและ demo Sciton moxi' },
  { id: 'tl8', accountId: '2', date: '2026-03-01', user: 'VARN', type: 'VISIT', description: 'เสนอเครื่อง Sciton moxi' },
  { id: 'tl9', accountId: '2', date: '2026-01-25', user: 'VARN', type: 'CALL', description: 'โทรติดตามการสั่ง cartridge' },
  { id: 'tl10', accountId: '3', date: '2026-03-04', user: 'PETCH', type: 'VISIT', description: 'เยี่ยมคลินิกครั้งแรก — แนะนำตัว' },
  { id: 'tl11', accountId: '4', date: '2026-03-01', user: 'ช่างวิทย์', type: 'SERVICE', description: 'ซ่อม handpiece — รออะไหล่' },
  { id: 'tl12', accountId: '4', date: '2026-02-20', user: 'FAH', type: 'VISIT', description: 'ติดตามงานซ่อม Ultraformer' },
  { id: 'tl13', accountId: '5', date: '2026-03-03', user: 'VI', type: 'VISIT', description: 'ติดต่อครั้งแรก — แพทย์สนใจ HIFU' },
  { id: 'tl14', accountId: '7', date: '2026-02-28', user: 'PETCH', type: 'CALL', description: 'โทรติดตามผลหลังติดตั้ง Picocare' },
  { id: 'tl15', accountId: '7', date: '2026-02-15', user: 'ช่างสมศักดิ์', type: 'SERVICE', description: 'PM ครั้งที่ 1 — Doublo Gold' },
];

// Helpers
export function getDevicesForAccount(accountId: string) { return mockInstalledDevices.filter(d => d.accountId === accountId); }
export function getConsumablesForAccount(accountId: string) { return mockConsumableUsage.filter(c => c.accountId === accountId); }
export function getServiceForAccount(accountId: string) { return mockServiceRecords.filter(s => s.accountId === accountId); }
export function getVisitsForAccount(accountId: string) { return mockVisitRecords.filter(v => v.accountId === accountId); }
export function getPurchasesForAccount(accountId: string) { return mockPurchaseRecords.filter(p => p.accountId === accountId); }
export function getDocumentsForAccount(accountId: string) { return mockDocuments.filter(d => d.accountId === accountId); }
export function getMarketingForAccount(accountId: string) { return mockMarketingRecords.filter(m => m.accountId === accountId); }
export function getReportsForAccount(accountId: string) { return mockVisitReports.filter(r => r.accountId === accountId); }
export function getTimelineForAccount(accountId: string) { return mockTimelineEvents.filter(t => t.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date)); }
export function getLifetimeRevenue(accountId: string) { return mockPurchaseRecords.filter(p => p.accountId === accountId).reduce((sum, p) => sum + p.price, 0); }

// Install Base types — data now stored in Supabase installations table

export type ProductCategory = 'ND2' | 'Trica 3D' | 'Quattro' | 'Picohi' | 'Freezero';

export interface PMCheckItem {
  name: string;
  pass: boolean | null;
  remark: string;
}

export interface PMCartridgeEntry {
  type: string;
  serialNumber: string;
  remainShot: number;
  shotTestRemain: number;
  shotTestTotal: number;
  passFail: boolean;
}

export interface PMReport {
  id: string;
  installationId: string;
  maintenanceNumber: number;
  scheduledDate: string;
  actualDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  swVer: string;
  fwVer: string;
  fwFlLr: string;
  fwSdLr: string;
  fwRm: string;
  fwAmp: string;
  operationChecklist: PMCheckItem[];
  safetyChecklist: PMCheckItem[];
  coolingChecklist: PMCheckItem[];
  cartridges: PMCartridgeEntry[];
  remark: string;
  serviceEngineer: string;
  serviceDate: string;
  serviceTel: string;
  customerName: string;
  customerDate: string;
  customerTel: string;
}

export type ReplacementType = 'SWAP' | 'LOANER' | 'LOANER_RETURN';

export interface ReplacementRecord {
  id: string;
  type: ReplacementType;
  date: string;
  oldSerialNumber: string;
  newSerialNumber: string;
  reason: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Installation {
  id: string;
  qcStockItemId: string;
  productCategory: ProductCategory;
  serialNumber: string;
  clinic: string;
  accountId?: string;
  installDate: string;
  warrantyDays: number;
  warrantyExpiry: string;
  province: string;
  region: string;
  notes: string;
  pmReports: PMReport[];
  replacementHistory: ReplacementRecord[];
  loanerSerialNumber?: string;
  originalSerialNumber?: string;
}

export function generatePMSchedule(installDate: string, count: number = 2): { number: number; date: string }[] {
  const schedule: { number: number; date: string }[] = [];
  const base = new Date(installDate);
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + 6 * i);
    schedule.push({ number: i, date: d.toISOString().split('T')[0] });
  }
  return schedule;
}

export function getND2OperationChecklist(): PMCheckItem[] {
  return [
    { name: 'Handpiece FL-Left', pass: null, remark: '' },
    { name: 'Handpiece FL-Right', pass: null, remark: '' },
    { name: 'Handpiece SD-Left', pass: null, remark: '' },
    { name: 'Handpiece SD-Right', pass: null, remark: '' },
    { name: 'Handpiece RM', pass: null, remark: '' },
    { name: 'Touch screen', pass: null, remark: '' },
    { name: 'Volume', pass: null, remark: '' },
    { name: 'Alarm', pass: null, remark: '' },
  ];
}

export function getND2SafetyChecklist(): PMCheckItem[] {
  return [
    { name: 'Switch', pass: null, remark: '' },
    { name: 'AC Plug', pass: null, remark: '' },
    { name: 'Foot Switch', pass: null, remark: '' },
    { name: 'UPS', pass: null, remark: '' },
  ];
}

export function getND2CoolingChecklist(): PMCheckItem[] {
  return [
    { name: 'Fan', pass: null, remark: '' },
  ];
}

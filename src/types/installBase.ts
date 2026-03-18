// Install Base types — data stored in Supabase installations table

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

export interface PMEnergyTestRow {
  tipSizeO: string;
  tipSizeOPF: boolean;
  tipSizeS: string;
  tipSizeSPF: boolean;
  tipSizeM: string;
  tipSizeMPF: boolean;
  waterFlowRate: string;
  statusRent: string;
}

export type PMResultStatus = 'complete' | 'claim' | 'repair' | 'other';

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
  energyTest?: PMEnergyTestRow[];
  remark: string;
  resultStatus?: PMResultStatus;
  resultOther?: string;
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

// Alias for backward compat
export type InstallationDetail = Installation;

export function generatePMSchedule(installDate: string, count: number = 2): { number: number; date: string }[] {
  const schedule: { number: number; date: string }[] = [];
  const base = new Date(installDate);
  if (isNaN(base.getTime())) return schedule;
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + 6 * i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    schedule.push({ number: i, date: `${yyyy}-${mm}-${dd}` });
  }
  return schedule;
}

// ─── ND2 ───
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
  return [{ name: 'Fan', pass: null, remark: '' }];
}

// ─── Trica 3D ───
export function getTrica3DOperationChecklist(): PMCheckItem[] {
  return [
    { name: 'Main Body', pass: null, remark: '' },
    { name: 'HD Camera (Center)', pass: null, remark: '' },
    { name: 'Right depth Camera', pass: null, remark: '' },
    { name: 'Right depth Camera', pass: null, remark: '' },
    { name: 'Mirror (Right/Left)', pass: null, remark: '' },
    { name: 'LED Light', pass: null, remark: '' },
    { name: 'UV Light', pass: null, remark: '' },
    { name: 'Chin rest', pass: null, remark: '' },
    { name: 'Shade cloth', pass: null, remark: '' },
    { name: 'Shawl', pass: null, remark: '' },
  ];
}
export function getTrica3DSafetyChecklist(): PMCheckItem[] {
  return [
    { name: 'AC Plug + Adapter', pass: null, remark: '' },
    { name: 'Speaker', pass: null, remark: '' },
  ];
}
export function getTrica3DCoolingChecklist(): PMCheckItem[] {
  return [
    { name: 'Natural Light', pass: null, remark: '' },
    { name: 'Cross Light', pass: null, remark: '' },
    { name: 'UV Light', pass: null, remark: '' },
    { name: 'Parallel Light', pass: null, remark: '' },
    { name: 'Cold Light', pass: null, remark: '' },
    { name: 'Red Blood', pass: null, remark: '' },
    { name: 'Red Zone', pass: null, remark: '' },
    { name: 'Brown', pass: null, remark: '' },
    { name: 'Ultraviolet', pass: null, remark: '' },
    { name: 'Red Heat Map', pass: null, remark: '' },
    { name: 'Brown Heat Map', pass: null, remark: '' },
  ];
}

// ─── Quattro ───
export function getQuattroOperationChecklist(): PMCheckItem[] {
  return [
    { name: 'Handpiece A ทำงานปกติ', pass: null, remark: '' },
    { name: 'Handpiece B ทำงานปกติ', pass: null, remark: '' },
    { name: 'Touch screen แสดงผลปกติ', pass: null, remark: '' },
    { name: 'ระบบเสียง/Volume', pass: null, remark: '' },
    { name: 'RF output ตามมาตรฐาน', pass: null, remark: '' },
    { name: 'Alarm แจ้งเตือน', pass: null, remark: '' },
  ];
}
export function getQuattroSafetyChecklist(): PMCheckItem[] {
  return [
    { name: 'Emergency stop', pass: null, remark: '' },
    { name: 'Key switch', pass: null, remark: '' },
    { name: 'Foot switch', pass: null, remark: '' },
    { name: 'AC Plug / สายไฟ', pass: null, remark: '' },
    { name: 'UPS / Stabilizer', pass: null, remark: '' },
  ];
}
export function getQuattroCoolingChecklist(): PMCheckItem[] {
  return [
    { name: 'พัดลมระบายความร้อน', pass: null, remark: '' },
    { name: 'อุณหภูมิขณะทำงาน', pass: null, remark: '' },
  ];
}

// ─── Picohi ───
export function getPicohiOperationChecklist(): PMCheckItem[] {
  return [
    { name: 'Handpiece ทำงานปกติ', pass: null, remark: '' },
    { name: 'Touch screen แสดงผลปกติ', pass: null, remark: '' },
    { name: 'Laser output ได้ค่าตามมาตรฐาน', pass: null, remark: '' },
    { name: 'Aiming beam ตรงตำแหน่ง', pass: null, remark: '' },
    { name: 'ระบบเสียง/Volume', pass: null, remark: '' },
    { name: 'Alarm แจ้งเตือน', pass: null, remark: '' },
    { name: 'Spot size adjustment', pass: null, remark: '' },
  ];
}
export function getPicohiSafetyChecklist(): PMCheckItem[] {
  return [
    { name: 'Emergency stop', pass: null, remark: '' },
    { name: 'Key switch', pass: null, remark: '' },
    { name: 'Interlock', pass: null, remark: '' },
    { name: 'Foot switch', pass: null, remark: '' },
    { name: 'AC Plug / สายไฟ', pass: null, remark: '' },
    { name: 'Protective eyewear', pass: null, remark: '' },
  ];
}
export function getPicohiCoolingChecklist(): PMCheckItem[] {
  return [
    { name: 'Water flow ปกติ', pass: null, remark: '' },
    { name: 'Water level ปกติ', pass: null, remark: '' },
    { name: 'พัดลมระบายความร้อน', pass: null, remark: '' },
    { name: 'อุณหภูมิขณะทำงาน', pass: null, remark: '' },
  ];
}

// ─── Freezero ───
export function getFreezeroOperationChecklist(): PMCheckItem[] {
  return [
    { name: 'Handpiece ทำงานปกติ', pass: null, remark: '' },
    { name: 'Touch screen แสดงผลปกติ', pass: null, remark: '' },
    { name: 'Vacuum pressure ปกติ', pass: null, remark: '' },
    { name: 'Cooling temperature ได้ตามมาตรฐาน', pass: null, remark: '' },
    { name: 'ระบบเสียง/Volume', pass: null, remark: '' },
    { name: 'Alarm แจ้งเตือน', pass: null, remark: '' },
  ];
}
export function getFreezeroSafetyChecklist(): PMCheckItem[] {
  return [
    { name: 'Emergency stop', pass: null, remark: '' },
    { name: 'Switch', pass: null, remark: '' },
    { name: 'AC Plug / สายไฟ', pass: null, remark: '' },
    { name: 'UPS / Stabilizer', pass: null, remark: '' },
  ];
}
export function getFreezeroCoolingChecklist(): PMCheckItem[] {
  return [
    { name: 'Compressor ทำงานปกติ', pass: null, remark: '' },
    { name: 'Refrigerant pressure', pass: null, remark: '' },
    { name: 'พัดลมระบายความร้อน', pass: null, remark: '' },
    { name: 'อุณหภูมิขณะทำงาน', pass: null, remark: '' },
  ];
}

// ─── Helper: get checklists by product category ───

export function getChecklistsByCategory(cat: ProductCategory): {
  operation: PMCheckItem[];
  safety: PMCheckItem[];
  cooling: PMCheckItem[];
} {
  switch (cat) {
    case 'Trica 3D': return { operation: getTrica3DOperationChecklist(), safety: getTrica3DSafetyChecklist(), cooling: getTrica3DCoolingChecklist() };
    case 'Quattro': return { operation: getQuattroOperationChecklist(), safety: getQuattroSafetyChecklist(), cooling: getQuattroCoolingChecklist() };
    case 'Picohi': return { operation: getPicohiOperationChecklist(), safety: getPicohiSafetyChecklist(), cooling: getPicohiCoolingChecklist() };
    case 'Freezero': return { operation: getFreezeroOperationChecklist(), safety: getFreezeroSafetyChecklist(), cooling: getFreezeroCoolingChecklist() };
    default: return { operation: getND2OperationChecklist(), safety: getND2SafetyChecklist(), cooling: getND2CoolingChecklist() };
  }
}

// ─── Firmware field config per category ───
export interface FirmwareFieldConfig {
  key: string;
  label: string;
}

export function getFirmwareFields(cat: ProductCategory): FirmwareFieldConfig[] {
  switch (cat) {
    case 'Trica 3D': return [
      { key: 'swVer', label: 'SW Ver' },
      { key: 'fwVer', label: 'FW Ver' },
    ];
    case 'Quattro': return [
      { key: 'swVer', label: 'SW Ver' },
      { key: 'fwVer', label: 'FW Ver' },
    ];
    case 'Picohi': return [
      { key: 'swVer', label: 'SW Ver' },
      { key: 'fwVer', label: 'FW Ver' },
    ];
    case 'Freezero': return [
      { key: 'swVer', label: 'SW Ver' },
      { key: 'fwVer', label: 'FW Ver' },
    ];
    default: return [
      { key: 'swVer', label: 'SW Ver' },
      { key: 'fwVer', label: 'FW Ver' },
      { key: 'fwFlLr', label: 'FW FL-LR' },
      { key: 'fwSdLr', label: 'FW SD-LR' },
      { key: 'fwRm', label: 'FW RM' },
      { key: 'fwAmp', label: 'FW AMP' },
    ];
  }
}

// ─── Product display names for PM report title ───
export function getProductDisplayName(cat: ProductCategory): string {
  switch (cat) {
    case 'ND2': return 'New Doublo 2.0';
    case 'Trica 3D': return 'Trica 3D';
    case 'Quattro': return 'Quattro';
    case 'Picohi': return 'Picohi';
    case 'Freezero': return 'Freezero';
    default: return cat;
  }
}

// ─── Section titles per category ───
export interface ChecklistSectionTitles {
  operation: string;
  safety: string;
  cooling: string;
}
export function getSectionTitles(cat: ProductCategory): ChecklistSectionTitles {
  switch (cat) {
    case 'Trica 3D': return {
      operation: '1. Operation System',
      safety: '2. Safety System',
      cooling: '3. Analysis Processing System',
    };
    default: return {
      operation: '1. Operation System and Handpiece',
      safety: '2. Safety System',
      cooling: '3. Cooling System',
    };
  }
}

// ─── Cartridge types per category ───
export function getCartridgeTypes(cat: ProductCategory): string[] | null {
  switch (cat) {
    case 'ND2': return ['A2.0', 'A3.0', 'A4.5', 'A6.0', 'L1.5', 'L3.0', 'L4.5', 'L9.0'];
    default: return null; // no cartridge section for other products
  }
}

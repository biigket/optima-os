// Install Base mock data - tracks installed devices with PM schedules

export type ProductCategory = 'ND2' | 'Trica 3D' | 'Quattro' | 'Picohi' | 'Freezero';

export interface PMCheckItem {
  name: string;
  pass: boolean | null; // null = N/A
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
  maintenanceNumber: number; // PM ครั้งที่ 1, 2, 3...
  scheduledDate: string;
  actualDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  // ND2-specific
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

export interface Installation {
  id: string;
  qcStockItemId: string; // links back to QC stock item
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
}

// Helper: generate PM schedule every 6 months from install date
export function generatePMSchedule(installDate: string, count: number = 4): { number: number; date: string }[] {
  const schedule: { number: number; date: string }[] = [];
  const base = new Date(installDate);
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + 6 * i);
    schedule.push({ number: i, date: d.toISOString().split('T')[0] });
  }
  return schedule;
}

// Default ND2 checklists
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

// Pre-populated installations from QC stock items with status ติดตั้งแล้ว
export const mockInstallations: Installation[] = [
  {
    id: 'inst-1',
    qcStockItemId: 'qc-1',
    productCategory: 'ND2',
    serialNumber: 'HNT01250051',
    clinic: 'KRM Clinic',
    installDate: '2024-09-15',
    warrantyDays: 365,
    warrantyExpiry: '2025-09-15',
    province: 'กรุงเทพฯ',
    region: 'กลาง',
    notes: '',
    pmReports: [
      {
        id: 'pm-1-1',
        installationId: 'inst-1',
        maintenanceNumber: 1,
        scheduledDate: '2025-03-15',
        actualDate: '2025-03-18',
        status: 'COMPLETED',
        swVer: '2009', fwVer: '2009', fwFlLr: '1006', fwSdLr: '1003', fwRm: '1004', fwAmp: '2035',
        operationChecklist: [
          { name: 'Handpiece FL-Left', pass: true, remark: 'HFL02240313' },
          { name: 'Handpiece FL-Right', pass: true, remark: 'HFL02240353' },
          { name: 'Handpiece SD-Left', pass: true, remark: 'HSD0324358C' },
          { name: 'Handpiece SD-Right', pass: true, remark: 'HSD0324356C' },
          { name: 'Handpiece RM', pass: true, remark: 'HRM04231475' },
          { name: 'Touch screen', pass: true, remark: '' },
          { name: 'Volume', pass: true, remark: '' },
          { name: 'Alarm', pass: true, remark: '' },
        ],
        safetyChecklist: [
          { name: 'Switch', pass: true, remark: '' },
          { name: 'AC Plug', pass: true, remark: '3 pins' },
          { name: 'Foot Switch', pass: true, remark: '' },
          { name: 'UPS', pass: null, remark: 'N/A' },
        ],
        coolingChecklist: [{ name: 'Fan', pass: true, remark: '' }],
        cartridges: [
          { type: 'A2.0', serialNumber: 'FLA223910161', remainShot: 17855, shotTestRemain: 17950, shotTestTotal: 5, passFail: true },
          { type: 'A3.0', serialNumber: 'FLA325710650', remainShot: 23285, shotTestRemain: 23280, shotTestTotal: 5, passFail: true },
        ],
        remark: 'สภาพเครื่องดี ทำ PM เรียบร้อย',
        serviceEngineer: 'Pornnapa', serviceDate: '2025-03-18', serviceTel: '060-979-4433',
        customerName: 'NAOUAON', customerDate: '2025-03-18', customerTel: '094-968-8264',
      },
    ],
  },
  {
    id: 'inst-2',
    qcStockItemId: 'qc-2',
    productCategory: 'ND2',
    serialNumber: 'HNT01240036',
    clinic: 'A-listic clinic',
    installDate: '2024-10-01',
    warrantyDays: 365,
    warrantyExpiry: '2025-10-01',
    province: 'กรุงเทพฯ',
    region: 'กลาง',
    notes: '',
    pmReports: [],
  },
  {
    id: 'inst-3',
    qcStockItemId: 'qc-3',
    productCategory: 'ND2',
    serialNumber: 'HNT01240067',
    clinic: 'Dr.Orawan clinic',
    installDate: '2024-08-20',
    warrantyDays: 365,
    warrantyExpiry: '2025-08-20',
    province: 'เชียงใหม่',
    region: 'เหนือ',
    notes: '',
    pmReports: [],
  },
];

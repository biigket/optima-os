// === ENUMS ===

export type CustomerStatus = 'NEW_LEAD' | 'DEMO_DONE' | 'NEGOTIATION' | 'PURCHASED' | 'DORMANT' | 'CLOSED';
export type OpportunityStage = 'NEW_LEAD' | 'CONTACTED' | 'DEMO_SCHEDULED' | 'DEMO_DONE' | 'NEGOTIATION' | 'WON' | 'LOST' | 'FOLLOW_UP' | 'WAITING_APPROVAL' | 'COMPARING' | 'PURCHASED' | 'CLOSED';
export type ProductCategory = 'DEVICE' | 'CONSUMABLE' | 'PART';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type PaymentCondition = 'CASH' | 'INSTALLMENT' | 'LEASING';
export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type VisitReportStatus = 'VISIT_FORM' | 'REPORT' | 'WEEKLY_PLAN' | 'CLOSED';
export type UserRole = 'SUPER_ADMIN' | 'HEAD_OF_DEPARTMENT' | 'STAFF';
export type Department = 'SALES' | 'PRODUCT' | 'SERVICE' | 'STOCK' | 'FINANCE' | 'MARKETING';

// === ENTITIES ===

export interface Account {
  id: string;
  company_name?: string;
  clinic_name: string;
  address?: string;
  tax_id?: string;
  entity_type?: string;
  branch_type?: string;
  phone?: string;
  email?: string;
  lead_source?: string;
  customer_status: CustomerStatus;
  grade?: string;
  single_or_chain?: string;
  assigned_sale?: string;
  notes?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  account_id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  line_id?: string;
  is_decision_maker?: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  product_name: string;
  product_code?: string;
  category: ProductCategory;
  description?: string;
  base_price?: number;
  created_at: string;
}

export type OpportunityType = 'DEVICE' | 'CONSUMABLE';

export interface Opportunity {
  id: string;
  account_id: string;
  stage: OpportunityStage;
  opportunity_type?: OpportunityType;
  interested_products?: string[];
  expected_value?: number;
  quantity?: number;
  assigned_sale?: string;
  customer_grade?: string;
  notes?: string;
  close_date?: string;
  next_activity_type?: string;
  next_activity_date?: string;
  probability?: number;
  budget_range?: string;
  payment_method?: string;
  competitors?: string;
  current_devices?: string;
  order_frequency?: string;
  stuck_reason?: string;
  authority_contact_id?: string;
  needs?: string[];
  created_at: string;
}

export interface Demo {
  id: string;
  account_id: string;
  opportunity_id?: string;
  demo_date?: string;
  location?: string;
  products_demo?: string[];
  fl45_shots?: number;
  fl30_shots?: number;
  fl20_shots?: number;
  sd45_shots?: number;
  sd30_shots?: number;
  sd15_shots?: number;
  rm_i49_tips?: number;
  rm_n49_tips?: number;
  demo_note?: string;
  visited_by?: string[];
  reminded?: boolean;
  created_at: string;
}

export interface Installation {
  id: string;
  account_id?: string;
  product_id?: string;
  serial_number?: string;
  province?: string;
  region?: string;
  district?: string;
  status?: string;
  has_rm_handpiece?: boolean;
  cartridges_installed?: string;
  install_date?: string;
  warranty_days?: number;
  warranty_expiry?: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  installation_id: string;
  maintenance_number: number;
  scheduled_date?: string;
  actual_date?: string;
  report_file?: string;
  photos?: string[];
  status?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  qt_number?: string;
  account_id?: string;
  sale_assigned?: string;
  product?: string;
  price?: number;
  qt_date?: string;
  qt_attachment?: string;
  invoice_sent?: boolean;
  payment_status: PaymentStatus;
  payment_condition?: PaymentCondition;
  leasing_doc?: string;
  approval_status: ApprovalStatus;
  created_at: string;
}

export interface PaymentInstallment {
  id: string;
  quotation_id: string;
  installment_number: number;
  due_date?: string;
  amount?: number;
  paid_date?: string;
  slip_file?: string;
  payment_channel?: string;
  receipt_sent?: boolean;
  created_at: string;
}

export interface VisitReport {
  id: string;
  account_id?: string;
  clinic_name?: string;
  location?: string;
  photo?: string;
  customer_type?: string;
  status: VisitReportStatus;
  check_in_at?: string;
  check_out_at?: string;
  action?: string;
  devices_in_use?: string;
  issues?: string;
  next_plan?: string;
  met_who?: string;
  new_contact_name?: string;
  new_contact_phone?: string;
  created_by?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  department?: Department;
  avatar_url?: string;
  created_at: string;
}

export type ActivityType = 'CALL' | 'MEETING' | 'TASK' | 'DEADLINE' | 'DEMO';
export type ActivityPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface Activity {
  id: string;
  opportunity_id: string;
  account_id: string;
  activity_type: ActivityType;
  title: string;
  activity_date: string;
  start_time?: string;
  end_time?: string;
  priority?: ActivityPriority;
  location?: string;
  description?: string;
  notes?: string;
  assigned_to?: string[];
  contact_id?: string;
  is_done: boolean;
  created_at: string;
  created_by?: string;
}

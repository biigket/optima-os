
-- =============================================
-- PROFILES TABLE (for auth users)
-- =============================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  role text NOT NULL DEFAULT 'STAFF' CHECK (role IN ('SUPER_ADMIN', 'HEAD_OF_DEPARTMENT', 'STAFF')),
  department text CHECK (department IN ('SALES', 'PRODUCT', 'SERVICE', 'STOCK', 'FINANCE', 'MARKETING')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 1. ACCOUNTS
-- =============================================
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  clinic_name text NOT NULL,
  address text,
  tax_id text,
  entity_type text,
  branch_type text,
  phone text,
  email text,
  google_map_link text,
  lead_source text,
  customer_status text NOT NULL DEFAULT 'NEW_LEAD' CHECK (customer_status IN ('NEW_LEAD','DEMO_DONE','NEGOTIATION','PURCHASED','DORMANT','CLOSED')),
  grade text,
  has_budget boolean DEFAULT false,
  is_kol boolean DEFAULT false,
  is_vip boolean DEFAULT false,
  single_or_chain text,
  assigned_sale text,
  registered_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view accounts" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 2. CONTACTS
-- =============================================
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  role text,
  phone text,
  email text,
  line_id text,
  is_decision_maker boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 3. PRODUCTS
-- =============================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  product_code text,
  category text NOT NULL DEFAULT 'DEVICE' CHECK (category IN ('DEVICE','CONSUMABLE','PART')),
  description text,
  base_price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 4. OPPORTUNITIES
-- =============================================
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  stage text NOT NULL DEFAULT 'NEW_LEAD' CHECK (stage IN ('NEW_LEAD','CONTACTED','DEMO_SCHEDULED','DEMO_DONE','NEGOTIATION','WON','LOST','FOLLOW_UP','WAITING_APPROVAL','COMPARING','PURCHASED','CLOSED')),
  interested_products text[],
  expected_value numeric,
  assigned_sale text,
  customer_grade text,
  notes text,
  close_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view opportunities" ON public.opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 5. DEMOS
-- =============================================
CREATE TABLE public.demos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  demo_date date,
  location text,
  products_demo text[],
  fl45_shots integer DEFAULT 0,
  fl30_shots integer DEFAULT 0,
  fl20_shots integer DEFAULT 0,
  sd45_shots integer DEFAULT 0,
  sd30_shots integer DEFAULT 0,
  sd15_shots integer DEFAULT 0,
  rm_i49_tips integer DEFAULT 0,
  rm_n49_tips integer DEFAULT 0,
  demo_note text,
  visited_by text[],
  reminded boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view demos" ON public.demos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert demos" ON public.demos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update demos" ON public.demos FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 6. INSTALLATIONS
-- =============================================
CREATE TABLE public.installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  serial_number text,
  province text,
  region text,
  district text,
  status text,
  has_rm_handpiece boolean DEFAULT false,
  cartridges_installed text,
  install_date date,
  warranty_days integer,
  warranty_expiry date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view installations" ON public.installations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert installations" ON public.installations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update installations" ON public.installations FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 7. MAINTENANCE_RECORDS
-- =============================================
CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id uuid REFERENCES public.installations(id) ON DELETE CASCADE NOT NULL,
  maintenance_number integer NOT NULL,
  scheduled_date date,
  actual_date date,
  report_file text,
  photos text[],
  status text DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view maintenance_records" ON public.maintenance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintenance_records" ON public.maintenance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintenance_records" ON public.maintenance_records FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 8. QUOTATIONS
-- =============================================
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qt_number text,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  sale_assigned text,
  product text,
  price numeric,
  qt_date date,
  qt_attachment text,
  invoice_sent boolean DEFAULT false,
  payment_status text DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PARTIAL','PAID')),
  payment_condition text CHECK (payment_condition IN ('CASH','INSTALLMENT','LEASING')),
  leasing_doc text,
  approval_status text DEFAULT 'DRAFT' CHECK (approval_status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 9. PAYMENT_INSTALLMENTS
-- =============================================
CREATE TABLE public.payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  installment_number integer NOT NULL,
  due_date date,
  amount numeric,
  paid_date date,
  slip_file text,
  payment_channel text,
  receipt_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view payment_installments" ON public.payment_installments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert payment_installments" ON public.payment_installments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update payment_installments" ON public.payment_installments FOR UPDATE TO authenticated USING (true);

-- =============================================
-- 10. VISIT_REPORTS
-- =============================================
CREATE TABLE public.visit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  clinic_name text,
  location text,
  photo text,
  customer_type text,
  status text DEFAULT 'VISIT_FORM' CHECK (status IN ('VISIT_FORM','REPORT','WEEKLY_PLAN','CLOSED')),
  check_in_at timestamptz,
  check_out_at timestamptz,
  action text,
  devices_in_use text,
  issues text,
  next_plan text,
  met_who text,
  new_contact_name text,
  new_contact_phone text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view visit_reports" ON public.visit_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert visit_reports" ON public.visit_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update visit_reports" ON public.visit_reports FOR UPDATE TO authenticated USING (true);

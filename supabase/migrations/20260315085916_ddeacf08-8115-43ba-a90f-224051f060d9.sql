
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key text NOT NULL,
  module_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_key, module_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view role_permissions" ON public.role_permissions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert role_permissions" ON public.role_permissions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update role_permissions" ON public.role_permissions FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete role_permissions" ON public.role_permissions FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert role_permissions" ON public.role_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update role_permissions" ON public.role_permissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete role_permissions" ON public.role_permissions FOR DELETE TO authenticated USING (true);

INSERT INTO public.role_permissions (role_key, module_key, can_view) VALUES
('OWNER','dashboard',true),('OWNER','leads',true),('OWNER','opportunities',true),('OWNER','weekly-plan',true),('OWNER','visit-checkin',true),('OWNER','visit-reports',true),('OWNER','demos',true),('OWNER','work-checkin',true),('OWNER','attendance',true),('OWNER','tasks',true),('OWNER','calendar',true),('OWNER','install-base',true),('OWNER','consumables',true),('OWNER','maintenance',true),('OWNER','qc-stock',true),('OWNER','quotations',true),('OWNER','payments',true),('OWNER','inventory',true),('OWNER','forecast',true),('OWNER','analytics',true),('OWNER','settings',true),
('SALES_MANAGER','dashboard',true),('SALES_MANAGER','leads',true),('SALES_MANAGER','opportunities',true),('SALES_MANAGER','weekly-plan',true),('SALES_MANAGER','visit-checkin',true),('SALES_MANAGER','visit-reports',true),('SALES_MANAGER','demos',true),('SALES_MANAGER','work-checkin',true),('SALES_MANAGER','attendance',true),('SALES_MANAGER','tasks',true),('SALES_MANAGER','calendar',true),('SALES_MANAGER','install-base',true),('SALES_MANAGER','consumables',true),('SALES_MANAGER','maintenance',true),('SALES_MANAGER','qc-stock',true),('SALES_MANAGER','quotations',true),('SALES_MANAGER','payments',true),('SALES_MANAGER','inventory',true),('SALES_MANAGER','forecast',true),('SALES_MANAGER','analytics',true),('SALES_MANAGER','settings',false),
('SALES','dashboard',true),('SALES','leads',true),('SALES','opportunities',true),('SALES','weekly-plan',true),('SALES','visit-checkin',true),('SALES','visit-reports',true),('SALES','demos',true),('SALES','work-checkin',true),('SALES','attendance',false),('SALES','tasks',true),('SALES','calendar',true),('SALES','install-base',false),('SALES','consumables',false),('SALES','maintenance',false),('SALES','qc-stock',false),('SALES','quotations',true),('SALES','payments',false),('SALES','inventory',false),('SALES','forecast',false),('SALES','analytics',false),('SALES','settings',false),
('PRODUCT','dashboard',true),('PRODUCT','leads',false),('PRODUCT','opportunities',false),('PRODUCT','weekly-plan',false),('PRODUCT','visit-checkin',false),('PRODUCT','visit-reports',false),('PRODUCT','demos',true),('PRODUCT','work-checkin',true),('PRODUCT','attendance',false),('PRODUCT','tasks',true),('PRODUCT','calendar',true),('PRODUCT','install-base',true),('PRODUCT','consumables',true),('PRODUCT','maintenance',false),('PRODUCT','qc-stock',true),('PRODUCT','quotations',false),('PRODUCT','payments',false),('PRODUCT','inventory',true),('PRODUCT','forecast',false),('PRODUCT','analytics',false),('PRODUCT','settings',false),
('SERVICE','dashboard',true),('SERVICE','leads',false),('SERVICE','opportunities',false),('SERVICE','weekly-plan',false),('SERVICE','visit-checkin',false),('SERVICE','visit-reports',false),('SERVICE','demos',false),('SERVICE','work-checkin',true),('SERVICE','attendance',false),('SERVICE','tasks',true),('SERVICE','calendar',true),('SERVICE','install-base',true),('SERVICE','consumables',true),('SERVICE','maintenance',true),('SERVICE','qc-stock',true),('SERVICE','quotations',false),('SERVICE','payments',false),('SERVICE','inventory',true),('SERVICE','forecast',false),('SERVICE','analytics',false),('SERVICE','settings',false),
('FINANCE','dashboard',true),('FINANCE','leads',false),('FINANCE','opportunities',false),('FINANCE','weekly-plan',false),('FINANCE','visit-checkin',false),('FINANCE','visit-reports',false),('FINANCE','demos',false),('FINANCE','work-checkin',true),('FINANCE','attendance',false),('FINANCE','tasks',true),('FINANCE','calendar',true),('FINANCE','install-base',false),('FINANCE','consumables',false),('FINANCE','maintenance',false),('FINANCE','qc-stock',false),('FINANCE','quotations',true),('FINANCE','payments',true),('FINANCE','inventory',false),('FINANCE','forecast',false),('FINANCE','analytics',false),('FINANCE','settings',false);

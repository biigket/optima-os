
CREATE TABLE public.visit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date date NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  visit_type text NOT NULL DEFAULT 'NEW',
  status text NOT NULL DEFAULT 'PLANNED',
  notes text,
  visit_report_id uuid REFERENCES public.visit_reports(id),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view visit_plans" ON public.visit_plans FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert visit_plans" ON public.visit_plans FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update visit_plans" ON public.visit_plans FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete visit_plans" ON public.visit_plans FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view visit_plans" ON public.visit_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert visit_plans" ON public.visit_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update visit_plans" ON public.visit_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete visit_plans" ON public.visit_plans FOR DELETE TO authenticated USING (true);

-- Also add anon policies for visit_reports to allow CRUD
CREATE POLICY "Anon can view visit_reports" ON public.visit_reports FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert visit_reports" ON public.visit_reports FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update visit_reports" ON public.visit_reports FOR UPDATE TO anon USING (true);

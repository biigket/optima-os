
-- Company-wide events (meetings, holidays, etc.) that block scheduling for all employees
CREATE TABLE public.company_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time text,
  end_time text,
  all_day boolean NOT NULL DEFAULT true,
  event_type text NOT NULL DEFAULT 'MEETING',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view company_events" ON public.company_events FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert company_events" ON public.company_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update company_events" ON public.company_events FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete company_events" ON public.company_events FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view company_events" ON public.company_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert company_events" ON public.company_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update company_events" ON public.company_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete company_events" ON public.company_events FOR DELETE TO authenticated USING (true);

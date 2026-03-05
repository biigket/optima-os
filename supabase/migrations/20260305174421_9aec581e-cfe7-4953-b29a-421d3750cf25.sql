
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  account_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'CALL',
  title text NOT NULL,
  activity_date date NOT NULL,
  start_time text,
  end_time text,
  priority text DEFAULT 'NORMAL',
  location text,
  description text,
  notes text,
  assigned_to text,
  contact_id uuid,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view activities" ON public.activities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert activities" ON public.activities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update activities" ON public.activities FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update activities" ON public.activities FOR UPDATE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

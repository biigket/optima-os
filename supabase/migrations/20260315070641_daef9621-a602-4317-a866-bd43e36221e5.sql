
CREATE TABLE public.work_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  department text,
  work_type text NOT NULL DEFAULT 'OFFICE',
  check_in_at timestamptz NOT NULL DEFAULT now(),
  check_out_at timestamptz,
  check_in_lat numeric,
  check_in_lng numeric,
  check_in_address text,
  check_out_lat numeric,
  check_out_lng numeric,
  check_out_address text,
  check_in_photo text,
  check_out_photo text,
  check_in_note text,
  check_out_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view work_checkins" ON public.work_checkins FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert work_checkins" ON public.work_checkins FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update work_checkins" ON public.work_checkins FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view work_checkins" ON public.work_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert work_checkins" ON public.work_checkins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update work_checkins" ON public.work_checkins FOR UPDATE TO authenticated USING (true);

-- Storage bucket for checkin photos
INSERT INTO storage.buckets (id, name, public) VALUES ('work-checkin-photos', 'work-checkin-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload work checkin photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'work-checkin-photos');
CREATE POLICY "Anyone can view work checkin photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'work-checkin-photos');

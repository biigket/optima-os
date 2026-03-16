
-- Announcements table for company-wide notices
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL',
  is_pinned boolean NOT NULL DEFAULT false,
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anon can view announcements" ON public.announcements FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert announcements" ON public.announcements FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update announcements" ON public.announcements FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete announcements" ON public.announcements FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (true);

-- Storage bucket for announcement files
INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-files', 'announcement-files', true);

-- Storage RLS
CREATE POLICY "Anyone can upload announcement files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'announcement-files');
CREATE POLICY "Anyone can view announcement files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'announcement-files');
CREATE POLICY "Anyone can delete announcement files" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'announcement-files');

-- Create storage bucket for opportunity files
INSERT INTO storage.buckets (id, name, public) VALUES ('opportunity-files', 'opportunity-files', true);

-- RLS policies for storage
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'opportunity-files');
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'opportunity-files');
CREATE POLICY "Authenticated users can delete files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'opportunity-files');
CREATE POLICY "Anon can upload files" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'opportunity-files');
CREATE POLICY "Anon can delete files" ON storage.objects FOR DELETE TO anon USING (bucket_id = 'opportunity-files');

-- Create opportunity_files metadata table
CREATE TABLE public.opportunity_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL,
  account_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view opportunity_files" ON public.opportunity_files FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert opportunity_files" ON public.opportunity_files FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete opportunity_files" ON public.opportunity_files FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view opportunity_files" ON public.opportunity_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert opportunity_files" ON public.opportunity_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can delete opportunity_files" ON public.opportunity_files FOR DELETE TO authenticated USING (true);
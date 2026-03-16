
-- Create account_documents table for manual file uploads
CREATE TABLE public.account_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  doc_label TEXT, -- user-defined label like 'สัญญาเก่า', 'ใบเสร็จ' etc.
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anon can view account_documents" ON public.account_documents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert account_documents" ON public.account_documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can delete account_documents" ON public.account_documents FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view account_documents" ON public.account_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert account_documents" ON public.account_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can delete account_documents" ON public.account_documents FOR DELETE TO authenticated USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('account-documents', 'account-documents', true);

-- Storage RLS policies
CREATE POLICY "Anyone can upload account docs" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'account-documents');
CREATE POLICY "Anyone can view account docs" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'account-documents');
CREATE POLICY "Anyone can delete account docs" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'account-documents');

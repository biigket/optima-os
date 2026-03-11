
-- Running number tracking for documents
CREATE TABLE public.document_running_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL, -- BN, IV, DN
  year_month text NOT NULL, -- e.g. '2026-03'
  last_number integer NOT NULL DEFAULT 0,
  UNIQUE (doc_type, year_month)
);

ALTER TABLE public.document_running_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select document_running_numbers" ON public.document_running_numbers FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert document_running_numbers" ON public.document_running_numbers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update document_running_numbers" ON public.document_running_numbers FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can select document_running_numbers" ON public.document_running_numbers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert document_running_numbers" ON public.document_running_numbers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update document_running_numbers" ON public.document_running_numbers FOR UPDATE TO authenticated USING (true);

-- Add document reference columns to quotations
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS billing_note_number text,
  ADD COLUMN IF NOT EXISTS tax_invoice_number text,
  ADD COLUMN IF NOT EXISTS delivery_note_number text,
  ADD COLUMN IF NOT EXISTS docs_generated_at timestamptz;

-- Function to get next running number atomically
CREATE OR REPLACE FUNCTION public.get_next_doc_number(p_doc_type text, p_year_month text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  INSERT INTO public.document_running_numbers (doc_type, year_month, last_number)
  VALUES (p_doc_type, p_year_month, 1)
  ON CONFLICT (doc_type, year_month)
  DO UPDATE SET last_number = document_running_numbers.last_number + 1
  RETURNING last_number INTO v_next;
  RETURN v_next;
END;
$$;


ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS approved_signature text,
  ADD COLUMN IF NOT EXISTS approved_name text,
  ADD COLUMN IF NOT EXISTS approved_position text;

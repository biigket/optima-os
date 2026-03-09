ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS deposit_type text DEFAULT 'NONE';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS deposit_value numeric DEFAULT 0;
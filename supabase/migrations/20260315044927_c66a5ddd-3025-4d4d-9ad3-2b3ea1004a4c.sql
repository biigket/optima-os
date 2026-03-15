ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS payment_link_url text,
ADD COLUMN IF NOT EXISTS payment_link_ref text,
ADD COLUMN IF NOT EXISTS portone_order_id text;
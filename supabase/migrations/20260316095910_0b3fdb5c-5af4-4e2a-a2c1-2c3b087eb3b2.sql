
ALTER TABLE public.qc_stock_items 
ADD COLUMN IF NOT EXISTS warranty_days integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS warranty_expiry date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS depleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_id uuid DEFAULT NULL;

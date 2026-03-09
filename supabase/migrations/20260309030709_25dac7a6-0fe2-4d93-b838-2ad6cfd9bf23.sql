ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS customer_signature text,
ADD COLUMN IF NOT EXISTS customer_signed_at timestamptz,
ADD COLUMN IF NOT EXISTS customer_signer_name text;
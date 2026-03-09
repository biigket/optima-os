
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS deposit_slip text,
ADD COLUMN IF NOT EXISTS deposit_slip_status text DEFAULT 'NO_SLIP',
ADD COLUMN IF NOT EXISTS deposit_paid_date date;

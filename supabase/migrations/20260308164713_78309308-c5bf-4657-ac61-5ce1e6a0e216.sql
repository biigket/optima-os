ALTER TABLE public.demos ADD COLUMN IF NOT EXISTS report_data jsonb DEFAULT NULL;
ALTER TABLE public.demos ADD COLUMN IF NOT EXISTS report_submitted boolean NOT NULL DEFAULT false;
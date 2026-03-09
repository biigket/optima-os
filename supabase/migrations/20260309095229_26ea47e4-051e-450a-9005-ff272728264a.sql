ALTER TABLE public.quotations ADD COLUMN has_installments boolean DEFAULT false;
ALTER TABLE public.quotations ADD COLUMN installment_count integer DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN payment_due_day integer DEFAULT null;
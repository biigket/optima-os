ALTER TABLE public.quotations DROP CONSTRAINT quotations_payment_condition_check;
ALTER TABLE public.quotations DROP CONSTRAINT quotations_payment_status_check;
ALTER TABLE public.quotations ADD CONSTRAINT quotations_payment_status_check CHECK (payment_status = ANY (ARRAY['UNPAID'::text, 'PARTIAL'::text, 'PAID'::text, 'DEPOSIT_PAID'::text]));
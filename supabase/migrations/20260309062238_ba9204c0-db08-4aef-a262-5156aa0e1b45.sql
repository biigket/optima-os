
-- Add payment verification columns to payment_installments
ALTER TABLE public.payment_installments 
  ADD COLUMN IF NOT EXISTS slip_status text DEFAULT 'NO_SLIP',
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reject_reason text,
  ADD COLUMN IF NOT EXISTS slip_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_date date;

-- Create storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for payment-slips bucket
CREATE POLICY "Anyone can view payment slips" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'payment-slips');
CREATE POLICY "Anyone can upload payment slips" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'payment-slips');
CREATE POLICY "Anyone can update payment slips" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'payment-slips');

-- Add anon RLS policies for payment_installments (currently only authenticated)
CREATE POLICY "Anon users can view payment_installments" ON public.payment_installments FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert payment_installments" ON public.payment_installments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update payment_installments" ON public.payment_installments FOR UPDATE TO anon USING (true);

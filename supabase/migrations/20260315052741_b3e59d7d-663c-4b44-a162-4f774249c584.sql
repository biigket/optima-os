
CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id),
  amount numeric NOT NULL,
  installment_months integer DEFAULT 0,
  payment_link_url text,
  payment_link_ref text,
  portone_order_id text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view payment_links" ON public.payment_links FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert payment_links" ON public.payment_links FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update payment_links" ON public.payment_links FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view payment_links" ON public.payment_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert payment_links" ON public.payment_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update payment_links" ON public.payment_links FOR UPDATE TO authenticated USING (true);

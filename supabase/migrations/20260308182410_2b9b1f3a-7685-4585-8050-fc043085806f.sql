
CREATE POLICY "Anon users can insert quotations"
ON public.quotations FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon users can update quotations"
ON public.quotations FOR UPDATE TO anon
USING (true);

CREATE POLICY "Anon users can view quotations"
ON public.quotations FOR SELECT TO anon
USING (true);

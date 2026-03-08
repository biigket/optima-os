
CREATE POLICY "Anon users can insert demos"
ON public.demos FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon users can view demos"
ON public.demos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon users can update demos"
ON public.demos FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Anon users can view products"
ON public.products
FOR SELECT
TO anon
USING (true);
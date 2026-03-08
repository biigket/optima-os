CREATE POLICY "Anon can delete demos" ON public.demos FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can delete demos" ON public.demos FOR DELETE TO authenticated USING (true);
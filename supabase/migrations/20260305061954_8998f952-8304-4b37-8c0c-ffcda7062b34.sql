
-- Add anon policies for accounts table
CREATE POLICY "Anon users can view accounts" ON public.accounts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert accounts" ON public.accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update accounts" ON public.accounts FOR UPDATE TO anon USING (true);

-- Add anon policies for contacts table
CREATE POLICY "Anon users can view contacts" ON public.contacts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert contacts" ON public.contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update contacts" ON public.contacts FOR UPDATE TO anon USING (true);

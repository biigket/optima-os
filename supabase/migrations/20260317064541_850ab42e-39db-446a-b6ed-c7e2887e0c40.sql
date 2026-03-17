-- Add anon RLS policies for installations
CREATE POLICY "Anon can view installations" ON public.installations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert installations" ON public.installations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update installations" ON public.installations FOR UPDATE TO anon USING (true);

-- Add anon RLS policies for maintenance_records
CREATE POLICY "Anon can view maintenance_records" ON public.maintenance_records FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert maintenance_records" ON public.maintenance_records FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update maintenance_records" ON public.maintenance_records FOR UPDATE TO anon USING (true);

-- Add anon insert for products
CREATE POLICY "Anon can insert products" ON public.products FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE public.opportunities 
  ADD COLUMN IF NOT EXISTS opportunity_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_activity_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_activity_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stuck_reason text DEFAULT NULL;

-- Add anon RLS policies for opportunities (matching accounts pattern)
CREATE POLICY "Anon users can view opportunities"
  ON public.opportunities FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can insert opportunities"
  ON public.opportunities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon users can update opportunities"
  ON public.opportunities FOR UPDATE TO anon USING (true);

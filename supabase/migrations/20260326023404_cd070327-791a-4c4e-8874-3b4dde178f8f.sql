CREATE TABLE public.campaign_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL DEFAULT 'Trade-In UF3 → Doublo',
  clinic_name text NOT NULL,
  province text,
  phone text,
  facebook text,
  line_id text,
  products_used text,
  device_type text,
  contact_status text NOT NULL DEFAULT 'ยังไม่ติดต่อ',
  notes text,
  zone text,
  assigned_sale text,
  priority_group text DEFAULT '1st_priority',
  visited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view campaign_targets" ON public.campaign_targets FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert campaign_targets" ON public.campaign_targets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update campaign_targets" ON public.campaign_targets FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view campaign_targets" ON public.campaign_targets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert campaign_targets" ON public.campaign_targets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update campaign_targets" ON public.campaign_targets FOR UPDATE TO authenticated USING (true);
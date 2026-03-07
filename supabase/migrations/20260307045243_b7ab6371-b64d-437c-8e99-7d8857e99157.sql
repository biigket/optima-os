
CREATE TABLE public.opportunity_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view stage history" ON public.opportunity_stage_history FOR SELECT USING (true);
CREATE POLICY "Anon can insert stage history" ON public.opportunity_stage_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can view stage history" ON public.opportunity_stage_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert stage history" ON public.opportunity_stage_history FOR INSERT TO authenticated WITH CHECK (true);

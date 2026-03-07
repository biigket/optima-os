
CREATE TABLE public.opportunity_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  account_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parent_id UUID REFERENCES public.opportunity_notes(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT
);

ALTER TABLE public.opportunity_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view opportunity_notes" ON public.opportunity_notes FOR SELECT USING (true);
CREATE POLICY "Anon can insert opportunity_notes" ON public.opportunity_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can update opportunity_notes" ON public.opportunity_notes FOR UPDATE USING (true);
CREATE POLICY "Anon can delete opportunity_notes" ON public.opportunity_notes FOR DELETE USING (true);
CREATE POLICY "Auth can view opportunity_notes" ON public.opportunity_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert opportunity_notes" ON public.opportunity_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update opportunity_notes" ON public.opportunity_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete opportunity_notes" ON public.opportunity_notes FOR DELETE TO authenticated USING (true);

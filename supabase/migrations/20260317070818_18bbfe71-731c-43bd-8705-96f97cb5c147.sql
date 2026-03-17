
-- Service Tickets table
CREATE TABLE public.service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL,
  account_id uuid REFERENCES public.accounts(id),
  clinic text NOT NULL DEFAULT '',
  item_type text NOT NULL DEFAULT 'DEVICE',
  item_id text NOT NULL DEFAULT '',
  item_name text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  symptom text NOT NULL DEFAULT '',
  symptom_photos text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'OPEN',
  priority text NOT NULL DEFAULT 'NORMAL',
  assigned_to text NOT NULL DEFAULT '',
  resolution text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- Service Ticket Updates table
CREATE TABLE public.service_ticket_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  photos text[] DEFAULT '{}',
  updated_by text NOT NULL DEFAULT '',
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for service_tickets
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view service_tickets" ON public.service_tickets FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert service_tickets" ON public.service_tickets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update service_tickets" ON public.service_tickets FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view service_tickets" ON public.service_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert service_tickets" ON public.service_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update service_tickets" ON public.service_tickets FOR UPDATE TO authenticated USING (true);

-- RLS for service_ticket_updates
ALTER TABLE public.service_ticket_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view service_ticket_updates" ON public.service_ticket_updates FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert service_ticket_updates" ON public.service_ticket_updates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can view service_ticket_updates" ON public.service_ticket_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert service_ticket_updates" ON public.service_ticket_updates FOR INSERT TO authenticated WITH CHECK (true);


CREATE TABLE public.mock_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'SALE',
  position text NOT NULL DEFAULT 'SALES',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view mock_users" ON public.mock_users FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert mock_users" ON public.mock_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update mock_users" ON public.mock_users FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete mock_users" ON public.mock_users FOR DELETE TO anon USING (true);
CREATE POLICY "Auth can view mock_users" ON public.mock_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert mock_users" ON public.mock_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update mock_users" ON public.mock_users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete mock_users" ON public.mock_users FOR DELETE TO authenticated USING (true);

INSERT INTO public.mock_users (name, username, password, role, position) VALUES
  ('ADMIN', 'admin', 'admin1234', 'ADMIN', 'OWNER'),
  ('FORD', 'ford', 'ford1234', 'SALE', 'SALES'),
  ('VARN', 'varn', 'varn1234', 'SALE', 'SALES'),
  ('PETCH', 'petch', 'petch1234', 'SALE', 'SALES'),
  ('FAH', 'fah', 'fah1234', 'SALE', 'SALES_MANAGER'),
  ('VI', 'vi', 'vi1234', 'SALE', 'PRODUCT'),
  ('NOT', 'not', 'not1234', 'SALE', 'SERVICE'),
  ('GAME', 'game', 'game1234', 'SALE', 'FINANCE');

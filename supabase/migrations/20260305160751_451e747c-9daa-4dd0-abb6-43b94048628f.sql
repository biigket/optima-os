ALTER TABLE public.opportunities ADD COLUMN authority_contact_id uuid REFERENCES public.contacts(id);
ALTER TABLE public.opportunities ADD COLUMN needs text[];
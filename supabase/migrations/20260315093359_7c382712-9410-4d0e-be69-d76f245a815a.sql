
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL,
  quotation_id uuid REFERENCES public.quotations(id),
  account_id uuid REFERENCES public.accounts(id),
  contract_date date NOT NULL DEFAULT CURRENT_DATE,
  product_type text NOT NULL DEFAULT 'ND2',
  
  -- Buyer info
  buyer_company_name text,
  buyer_representative_name text,
  buyer_id_number text,
  buyer_id_expiry date,
  buyer_address text,
  buyer_phone text,
  
  -- Seller info  
  seller_representative_name text DEFAULT 'นายแพทย์คุณวุฒิ ลิ้มเวฆา',
  
  -- Product details
  product_name text,
  product_brand text,
  product_origin text,
  product_quantity integer DEFAULT 1,
  product_accessories jsonb DEFAULT '[]'::jsonb,
  
  -- Payment
  total_price numeric,
  deposit_amount numeric DEFAULT 0,
  deposit_date date,
  remaining_amount numeric DEFAULT 0,
  payment_method text,
  installment_count integer DEFAULT 1,
  payment_details jsonb DEFAULT '[]'::jsonb,
  qt_number text,
  
  -- Delivery
  delivery_address text,
  delivery_days integer DEFAULT 60,
  
  -- Warranty
  warranty_years integer DEFAULT 1,
  warranty_details jsonb DEFAULT '[]'::jsonb,
  
  -- Appendix / additional terms
  appendix_items jsonb DEFAULT '[]'::jsonb,
  additional_notes text,
  
  -- Status
  status text NOT NULL DEFAULT 'DRAFT',
  
  -- Signatures
  seller_signature text,
  buyer_signature text,
  witness_name text,
  signed_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view contracts" ON public.contracts FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert contracts" ON public.contracts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update contracts" ON public.contracts FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true);

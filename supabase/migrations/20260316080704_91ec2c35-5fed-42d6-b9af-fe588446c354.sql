
-- Unified QC Stock Items table for all product types
CREATE TABLE public.qc_stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL DEFAULT 'ND2', -- ND2, TRICA3D, QUATTRO, PICOHI, FREEZERO, CARTRIDGE
  serial_number TEXT,
  status TEXT DEFAULT 'พร้อมขาย',
  reserved_for TEXT,
  clinic TEXT,
  fail_reason TEXT,
  notes TEXT,
  received_date DATE,
  storage_location TEXT,
  -- ND2 specific
  hfl1 TEXT,
  hfl2 TEXT,
  hsd1 TEXT,
  hsd2 TEXT,
  hrm TEXT,
  hrm_sell_or_keep TEXT,
  ups_stabilizer TEXT,
  inspection_doc TEXT,
  -- Trica3D specific
  install_date DATE,
  borrow_from TEXT,
  borrow_to TEXT,
  email_trica TEXT,
  -- Quattro/Picohi/Freezero specific
  handpiece TEXT,
  -- Cartridge specific
  cartridge_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qc_stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view qc_stock_items" ON public.qc_stock_items FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can insert qc_stock_items" ON public.qc_stock_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update qc_stock_items" ON public.qc_stock_items FOR UPDATE TO anon USING (true);
CREATE POLICY "Auth can view qc_stock_items" ON public.qc_stock_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert qc_stock_items" ON public.qc_stock_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update qc_stock_items" ON public.qc_stock_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete qc_stock_items" ON public.qc_stock_items FOR DELETE TO authenticated USING (true);

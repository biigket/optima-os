ALTER TABLE opportunities ADD COLUMN probability integer DEFAULT 10;
ALTER TABLE opportunities ADD COLUMN budget_range text;
ALTER TABLE opportunities ADD COLUMN payment_method text;
ALTER TABLE opportunities ADD COLUMN competitors text;
ALTER TABLE opportunities ADD COLUMN current_devices text;
ALTER TABLE opportunities ADD COLUMN order_frequency text;

INSERT INTO storage.buckets (id, name, public) VALUES ('quotation-files', 'quotation-files', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view quotation files" ON storage.objects FOR SELECT USING (bucket_id = 'quotation-files');
CREATE POLICY "Authenticated can upload quotation files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quotation-files');

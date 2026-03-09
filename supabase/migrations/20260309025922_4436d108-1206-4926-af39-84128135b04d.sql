CREATE POLICY "Anon can upload quotation files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quotation-files');

CREATE POLICY "Anon can update quotation files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'quotation-files');

CREATE POLICY "Authenticated can update quotation files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'quotation-files');
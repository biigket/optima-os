
insert into storage.buckets (id, name, public) values ('checkin-photos', 'checkin-photos', true);

CREATE POLICY "Anyone can upload checkin photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'checkin-photos');
CREATE POLICY "Anyone can view checkin photos" ON storage.objects FOR SELECT USING (bucket_id = 'checkin-photos');

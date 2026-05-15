
INSERT INTO storage.buckets (id, name, public) VALUES ('desafios-fotos', 'desafios-fotos', false);

CREATE POLICY "workers upload own photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'desafios-fotos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "workers see own photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'desafios-fotos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

CREATE POLICY "admins manage photos" ON storage.objects FOR ALL
  USING (bucket_id = 'desafios-fotos' AND public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('narracoes', 'narracoes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Narracoes publicas leitura" ON storage.objects;
CREATE POLICY "Narracoes publicas leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'narracoes');
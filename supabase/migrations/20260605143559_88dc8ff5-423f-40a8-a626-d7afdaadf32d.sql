
-- 1) cupons: bloquear INSERT por usuários não-admin de forma explícita
DROP POLICY IF EXISTS "cupons no worker insert" ON public.cupons;
CREATE POLICY "cupons no worker insert"
  ON public.cupons
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 2) desafios-fotos: políticas escopadas ao próprio usuário (pasta = auth.uid())
DROP POLICY IF EXISTS "desafios fotos workers insert own folder" ON storage.objects;
CREATE POLICY "desafios fotos workers insert own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'desafios-fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "desafios fotos workers update own" ON storage.objects;
CREATE POLICY "desafios fotos workers update own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'desafios-fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'desafios-fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "desafios fotos workers delete own" ON storage.objects;
CREATE POLICY "desafios fotos workers delete own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'desafios-fotos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) narracoes: somente admin pode escrever; leitura pública mantida
DROP POLICY IF EXISTS "narracoes admin insert" ON storage.objects;
CREATE POLICY "narracoes admin insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'narracoes' AND public.is_admin());

DROP POLICY IF EXISTS "narracoes admin update" ON storage.objects;
CREATE POLICY "narracoes admin update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'narracoes' AND public.is_admin())
  WITH CHECK (bucket_id = 'narracoes' AND public.is_admin());

DROP POLICY IF EXISTS "narracoes admin delete" ON storage.objects;
CREATE POLICY "narracoes admin delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'narracoes' AND public.is_admin());

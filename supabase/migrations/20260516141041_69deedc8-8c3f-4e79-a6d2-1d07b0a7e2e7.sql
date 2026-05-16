
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS imagem_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avisos-imagens', 'avisos-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avisos imagens publicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'avisos-imagens');

CREATE POLICY "Admins gerenciam imagens de avisos insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avisos-imagens' AND public.is_admin());

CREATE POLICY "Admins gerenciam imagens de avisos update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avisos-imagens' AND public.is_admin());

CREATE POLICY "Admins gerenciam imagens de avisos delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avisos-imagens' AND public.is_admin());

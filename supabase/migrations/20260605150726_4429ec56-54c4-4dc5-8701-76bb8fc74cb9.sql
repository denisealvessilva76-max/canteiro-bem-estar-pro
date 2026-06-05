
-- 1. Remove alertas from realtime publication (prevents cross-worker leakage)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='alertas') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.alertas';
  END IF;
END $$;

-- 2. Explicit restrictive DELETE block on cupons for non-admins
DROP POLICY IF EXISTS "cupons restrict delete non admin" ON public.cupons;
CREATE POLICY "cupons restrict delete non admin" ON public.cupons
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. Restrict odonto_dicas read to authenticated only
DROP POLICY IF EXISTS "all read odonto_dicas" ON public.odonto_dicas;
CREATE POLICY "auth read odonto_dicas" ON public.odonto_dicas
  FOR SELECT TO authenticated
  USING (ativo OR public.is_admin());

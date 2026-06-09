DROP POLICY IF EXISTS "matriculas leitura pública" ON public.matriculas_autorizadas;
CREATE POLICY "matriculas admin select" ON public.matriculas_autorizadas FOR SELECT TO authenticated USING (public.is_admin());
REVOKE SELECT ON public.matriculas_autorizadas FROM anon;
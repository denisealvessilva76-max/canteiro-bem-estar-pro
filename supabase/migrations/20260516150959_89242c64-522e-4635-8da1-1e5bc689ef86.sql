
-- 1) Fix overly permissive INSERT on alertas
DROP POLICY IF EXISTS "system insert alertas" ON public.alertas;
CREATE POLICY "own insert alertas"
  ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2) Remove user self-insert/update on user_conquistas (only admin/service grants)
DROP POLICY IF EXISTS "own insert user_conquistas" ON public.user_conquistas;
DROP POLICY IF EXISTS "own update user_conquistas" ON public.user_conquistas;

-- 3) Add DELETE policies for own logs/records
CREATE POLICY "own delete alongamento_logs" ON public.alongamento_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete alongamento_logs" ON public.alongamento_logs
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "own delete hidratacao_logs" ON public.hidratacao_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete hidratacao_logs" ON public.hidratacao_logs
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "own delete checkin_diario" ON public.checkin_diario
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete checkin_diario" ON public.checkin_diario
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "own delete saude_logs" ON public.saude_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete saude_logs" ON public.saude_logs
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "own delete progresso_desafios" ON public.progresso_desafios
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete progresso_desafios" ON public.progresso_desafios
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "own delete desafio_checkins" ON public.desafio_checkins
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin delete desafio_checkins" ON public.desafio_checkins
  FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "admin delete resgates" ON public.resgates
  FOR DELETE TO authenticated USING (is_admin());

-- 4) Realtime: require authenticated users for channel subscriptions
DROP POLICY IF EXISTS "authenticated can subscribe to realtime" ON realtime.messages;
CREATE POLICY "authenticated can subscribe to realtime"
  ON realtime.messages FOR SELECT TO authenticated USING (true);

-- 5) Revoke direct API EXECUTE on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;

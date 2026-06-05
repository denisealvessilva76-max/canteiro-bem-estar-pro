-- 1. Restringe leitura pública das clínicas: agora só autenticados
DROP POLICY IF EXISTS "all read ubs_clinicas" ON public.ubs_clinicas;
CREATE POLICY "auth read ubs_clinicas"
  ON public.ubs_clinicas
  FOR SELECT
  TO authenticated
  USING (ativo OR public.is_admin());

-- 2. Revoga EXECUTE de anon/public em todas as funções SECURITY DEFINER do schema public.
--    - Triggers (handle_*, tg_*, classify_pressao) também perdem EXECUTE de authenticated,
--      pois rodam via trigger e não devem ser chamadas via API.
--    - Helpers usados em RLS (has_role, is_admin) mantêm EXECUTE para authenticated.
--    - conceder_medalha é chamada via RPC pelo cliente autenticado → mantém authenticated.
--    - gerar_codigo_cupom só é usada em trigger interno → revoga de todos.

-- Trigger functions: sem EXECUTE para ninguém além de postgres/service_role
REVOKE EXECUTE ON FUNCTION public.handle_hidratacao_points()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_checkin_points()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_cupons_por_marcos()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_alongamento_medalhas()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_desafio_medalhas()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_checkin_medalhas()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_hidratacao_medalhas()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.classify_pressao()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gerar_codigo_cupom()            FROM PUBLIC, anon, authenticated;

-- Helpers de RLS: revoga de anon/public, mantém authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin()                       FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin()                       TO authenticated;

-- conceder_medalha: chamada via RPC por usuários autenticados (já valida auth.uid()=_user_id)
REVOKE EXECUTE ON FUNCTION public.conceder_medalha(uuid, text)    FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.conceder_medalha(uuid, text)    TO authenticated;
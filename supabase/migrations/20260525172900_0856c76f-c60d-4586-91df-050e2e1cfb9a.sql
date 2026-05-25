
-- 1. Fix search_path on gerar_codigo_cupom
CREATE OR REPLACE FUNCTION public.gerar_codigo_cupom()
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  SELECT 'CS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$function$;

-- 2. Harden conceder_medalha to prevent granting medals to other users
CREATE OR REPLACE FUNCTION public.conceder_medalha(_user_id uuid, _codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_cid uuid; v_pts int;
BEGIN
  -- Only allow granting medals to the authenticated user (anti-fraude)
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT id, pontos INTO v_cid, v_pts FROM public.conquistas WHERE codigo = _codigo;
  IF v_cid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_conquistas (user_id, conquista_id) VALUES (_user_id, v_cid)
  ON CONFLICT (user_id, conquista_id) DO NOTHING;
  IF FOUND THEN
    UPDATE public.profiles SET pontos_acumulados = pontos_acumulados + COALESCE(v_pts,0), updated_at = now() WHERE id = _user_id;
  END IF;
END$function$;

-- 3. Revoke EXECUTE on internal trigger / helper functions from anon/authenticated/public
REVOKE EXECUTE ON FUNCTION public.classify_pressao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_checkin_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_hidratacao_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_alongamento_medalhas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_checkin_medalhas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_cupons_por_marcos() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_desafio_medalhas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_hidratacao_medalhas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gerar_codigo_cupom() FROM PUBLIC, anon, authenticated;

-- has_role and is_admin are used inside RLS policies; keep them callable
-- conceder_medalha is called via RPC by the games; keep callable by authenticated
REVOKE EXECUTE ON FUNCTION public.conceder_medalha(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.conceder_medalha(uuid, text) TO authenticated;

-- 4. Restrict parametros read to authenticated users
DROP POLICY IF EXISTS "all read parametros" ON public.parametros;
CREATE POLICY "authenticated read parametros" ON public.parametros
  FOR SELECT TO authenticated USING (true);

-- 5. Remove sensitive tables from realtime publication so users can't subscribe
-- to other workers' health/personal data via Realtime
DO $$
BEGIN
  PERFORM 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles';
  IF FOUND THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles; END IF;

  PERFORM 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'checkin_diario';
  IF FOUND THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.checkin_diario; END IF;

  PERFORM 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'saude_logs';
  IF FOUND THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.saude_logs; END IF;

  PERFORM 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ciclo_menstrual';
  IF FOUND THEN ALTER PUBLICATION supabase_realtime DROP TABLE public.ciclo_menstrual; END IF;
END $$;


-- 1) Coluna de foto de perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('recompensas-imagens', 'recompensas-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Policies avatars: leitura pública, upload/update/delete só do próprio usuário (pasta = user_id)
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars user upload" ON storage.objects;
CREATE POLICY "avatars user upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user update" ON storage.objects;
CREATE POLICY "avatars user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "avatars user delete" ON storage.objects;
CREATE POLICY "avatars user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies recompensas-imagens: leitura pública, escrita só admin
DROP POLICY IF EXISTS "recompensas img public read" ON storage.objects;
CREATE POLICY "recompensas img public read" ON storage.objects FOR SELECT USING (bucket_id = 'recompensas-imagens');

DROP POLICY IF EXISTS "recompensas img admin write" ON storage.objects;
CREATE POLICY "recompensas img admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recompensas-imagens' AND public.is_admin());

DROP POLICY IF EXISTS "recompensas img admin update" ON storage.objects;
CREATE POLICY "recompensas img admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'recompensas-imagens' AND public.is_admin());

DROP POLICY IF EXISTS "recompensas img admin delete" ON storage.objects;
CREATE POLICY "recompensas img admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recompensas-imagens' AND public.is_admin());

-- 3) Medalhas (conquistas) — sementes
INSERT INTO public.conquistas (codigo, titulo, descricao, icone, pontos) VALUES
  ('hidrata_7',    'Mestre da Hidratação',  '7 dias seguidos batendo a meta de água',     '💧', 30),
  ('checkin_7',    'Constante',             '7 check-ins seguidos',                        '🔥', 30),
  ('checkin_30',   'Lendário',              '30 check-ins seguidos',                       '👑', 100),
  ('desafio_1',    'Desafiador',            'Concluiu seu primeiro desafio',               '🏆', 50),
  ('mental_5',     'Mente em Paz',          '5 check-ins de saúde mental',                 '🧘', 30),
  ('alongou_5',    'Flexível',              'Alongou 5 dias diferentes',                   '🤸', 20)
ON CONFLICT (codigo) DO NOTHING;

-- Unique para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS user_conquistas_unico ON public.user_conquistas(user_id, conquista_id);
CREATE UNIQUE INDEX IF NOT EXISTS conquistas_codigo_unico ON public.conquistas(codigo);

-- 4) Função SECURITY DEFINER que concede medalha (bypass do "users can't insert")
CREATE OR REPLACE FUNCTION public.conceder_medalha(_user_id uuid, _codigo text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_cid uuid; v_pts int;
BEGIN
  SELECT id, pontos INTO v_cid, v_pts FROM public.conquistas WHERE codigo = _codigo;
  IF v_cid IS NULL THEN RETURN; END IF;
  INSERT INTO public.user_conquistas (user_id, conquista_id) VALUES (_user_id, v_cid)
  ON CONFLICT (user_id, conquista_id) DO NOTHING;
  IF FOUND THEN
    UPDATE public.profiles SET pontos_acumulados = pontos_acumulados + COALESCE(v_pts,0), updated_at = now() WHERE id = _user_id;
  END IF;
END$$;

-- Revogar EXECUTE pública (segurança)
REVOKE EXECUTE ON FUNCTION public.conceder_medalha(uuid, text) FROM PUBLIC, anon, authenticated;

-- 5) Triggers que detectam marcos
-- 5a) checkin streak
CREATE OR REPLACE FUNCTION public.tg_checkin_medalhas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_streak int;
BEGIN
  SELECT ofensiva_dias INTO v_streak FROM public.profiles WHERE id = NEW.user_id;
  IF v_streak >= 7  THEN PERFORM public.conceder_medalha(NEW.user_id, 'checkin_7');  END IF;
  IF v_streak >= 30 THEN PERFORM public.conceder_medalha(NEW.user_id, 'checkin_30'); END IF;
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS tg_checkin_medalhas ON public.checkin_diario;
CREATE TRIGGER tg_checkin_medalhas AFTER INSERT ON public.checkin_diario
  FOR EACH ROW EXECUTE FUNCTION public.tg_checkin_medalhas();

-- 5b) hidratação 7 dias
CREATE OR REPLACE FUNCTION public.tg_hidratacao_medalhas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dias int;
BEGIN
  SELECT COUNT(DISTINCT data) INTO v_dias FROM public.hidratacao_logs
    WHERE user_id = NEW.user_id AND data >= CURRENT_DATE - INTERVAL '7 days';
  IF v_dias >= 7 THEN PERFORM public.conceder_medalha(NEW.user_id, 'hidrata_7'); END IF;
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS tg_hidratacao_medalhas ON public.hidratacao_logs;
CREATE TRIGGER tg_hidratacao_medalhas AFTER INSERT ON public.hidratacao_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_hidratacao_medalhas();

-- 5c) desafio concluído
CREATE OR REPLACE FUNCTION public.tg_desafio_medalhas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.conceder_medalha(NEW.user_id, 'desafio_1');
  END IF;
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS tg_desafio_medalhas ON public.progresso_desafios;
CREATE TRIGGER tg_desafio_medalhas AFTER UPDATE ON public.progresso_desafios
  FOR EACH ROW EXECUTE FUNCTION public.tg_desafio_medalhas();

-- 5d) mental 5 check-ins (humor_score) -- usa checkin_diario humor
-- 5e) alongamento 5 dias
CREATE OR REPLACE FUNCTION public.tg_alongamento_medalhas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dias int;
BEGIN
  SELECT COUNT(DISTINCT data) INTO v_dias FROM public.alongamento_logs WHERE user_id = NEW.user_id;
  IF v_dias >= 5 THEN PERFORM public.conceder_medalha(NEW.user_id, 'alongou_5'); END IF;
  RETURN NEW;
END$$;
DROP TRIGGER IF EXISTS tg_alongamento_medalhas ON public.alongamento_logs;
CREATE TRIGGER tg_alongamento_medalhas AFTER INSERT ON public.alongamento_logs
  FOR EACH ROW EXECUTE FUNCTION public.tg_alongamento_medalhas();

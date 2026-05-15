
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');
CREATE TYPE public.turno AS ENUM ('diurno', 'noturno');
CREATE TYPE public.classificacao_pressao AS ENUM ('normal', 'alerta', 'alta', 'baixa');
CREATE TYPE public.nivel_urgencia AS ENUM ('info', 'atencao', 'critico');
CREATE TYPE public.categoria_aviso AS ENUM ('informativo', 'saude', 'lembrete', 'urgente');
CREATE TYPE public.status_desafio AS ENUM ('disponivel', 'em_andamento', 'concluido', 'abandonado');

-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  turno public.turno NOT NULL DEFAULT 'diurno',
  cargo TEXT,
  grupo_risco TEXT,
  peso NUMERIC(5,2),
  altura NUMERIC(4,2),
  exposicao_sol BOOLEAN DEFAULT TRUE,
  pontos_acumulados INT NOT NULL DEFAULT 0,
  ofensiva_dias INT NOT NULL DEFAULT 0,
  ultimo_checkin DATE,
  avatar_id INT DEFAULT 1,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_psicologa TEXT,
  whatsapp_assistente TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============= USER ROLES (separate table for security) =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- ============= CHECK-IN DIÁRIO =============
CREATE TABLE public.checkin_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  humor_icone TEXT NOT NULL,
  humor_score INT NOT NULL,
  motivo_texto TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);
ALTER TABLE public.checkin_diario ENABLE ROW LEVEL SECURITY;

-- ============= HIDRATAÇÃO =============
CREATE TABLE public.hidratacao_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  ml_consumidos INT NOT NULL,
  cor_urina INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hidratacao_user_data ON public.hidratacao_logs(user_id, data);
ALTER TABLE public.hidratacao_logs ENABLE ROW LEVEL SECURITY;

-- ============= SAÚDE (Pressão + Sintomas) =============
CREATE TABLE public.saude_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  pressao_sistolica INT,
  pressao_diastolica INT,
  classificacao_pressao public.classificacao_pressao,
  sintomas TEXT[] DEFAULT ARRAY[]::TEXT[],
  outros_sintomas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saude_user_data ON public.saude_logs(user_id, data);
ALTER TABLE public.saude_logs ENABLE ROW LEVEL SECURITY;

-- ============= ALERTAS =============
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nivel_urgencia public.nivel_urgencia NOT NULL DEFAULT 'atencao',
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido_por UUID REFERENCES auth.users(id),
  resolvido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- ============= DESAFIOS =============
CREATE TABLE public.desafios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  meta TEXT NOT NULL,
  duracao_dias INT NOT NULL DEFAULT 7,
  pontos_recompensa INT NOT NULL DEFAULT 50,
  dificuldade TEXT DEFAULT 'medio',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.progresso_desafios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  desafio_id UUID NOT NULL REFERENCES public.desafios(id) ON DELETE CASCADE,
  status public.status_desafio NOT NULL DEFAULT 'em_andamento',
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  foto_url TEXT,
  foto_validada BOOLEAN DEFAULT NULL,
  observacoes TEXT,
  UNIQUE(user_id, desafio_id)
);
ALTER TABLE public.progresso_desafios ENABLE ROW LEVEL SECURITY;

-- ============= AVISOS =============
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  categoria public.categoria_aviso NOT NULL DEFAULT 'informativo',
  publicado BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.avisos_lidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aviso_id UUID NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  lido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, aviso_id)
);
ALTER TABLE public.avisos_lidos ENABLE ROW LEVEL SECURITY;

-- ============= RECOMPENSAS =============
CREATE TABLE public.recompensas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  custo_pontos INT NOT NULL,
  estoque INT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.resgates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recompensa_id UUID NOT NULL REFERENCES public.recompensas(id),
  pontos_gastos INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resgates ENABLE ROW LEVEL SECURITY;

-- ============= CONQUISTAS =============
CREATE TABLE public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  pontos INT DEFAULT 0
);
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES public.conquistas(id) ON DELETE CASCADE,
  conquistado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, conquista_id)
);
ALTER TABLE public.user_conquistas ENABLE ROW LEVEL SECURITY;

-- ============= PARÂMETROS (regras parametrizáveis) =============
CREATE TABLE public.parametros (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parametros ENABLE ROW LEVEL SECURITY;

-- ============= ALONGAMENTOS LOG =============
CREATE TABLE public.alongamento_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  duracao_segundos INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alongamento_logs ENABLE ROW LEVEL SECURITY;

-- ============= RLS POLICIES =============

-- profiles
CREATE POLICY "users see own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admins see all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "admins update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "service inserts profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- generic worker tables: own data + admin sees all
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['checkin_diario','hidratacao_logs','saude_logs','progresso_desafios','user_conquistas','resgates','avisos_lidos','alongamento_logs']) LOOP
    EXECUTE format('CREATE POLICY "own select %1$s" ON public.%1$s FOR SELECT USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own insert %1$s" ON public.%1$s FOR INSERT WITH CHECK (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "own update %1$s" ON public.%1$s FOR UPDATE USING (auth.uid() = user_id);', t);
    EXECUTE format('CREATE POLICY "admin select %1$s" ON public.%1$s FOR SELECT USING (public.is_admin());', t);
    EXECUTE format('CREATE POLICY "admin update %1$s" ON public.%1$s FOR UPDATE USING (public.is_admin());', t);
  END LOOP;
END$$;

-- alertas: workers see own, admin sees + manages all
CREATE POLICY "own alertas" ON public.alertas FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "system insert alertas" ON public.alertas FOR INSERT WITH CHECK (true);
CREATE POLICY "admin update alertas" ON public.alertas FOR UPDATE USING (public.is_admin());

-- public read tables
CREATE POLICY "all read desafios" ON public.desafios FOR SELECT USING (ativo = true OR public.is_admin());
CREATE POLICY "admin manage desafios" ON public.desafios FOR ALL USING (public.is_admin());
CREATE POLICY "all read avisos" ON public.avisos FOR SELECT USING (publicado = true OR public.is_admin());
CREATE POLICY "admin manage avisos" ON public.avisos FOR ALL USING (public.is_admin());
CREATE POLICY "all read recompensas" ON public.recompensas FOR SELECT USING (ativo = true OR public.is_admin());
CREATE POLICY "admin manage recompensas" ON public.recompensas FOR ALL USING (public.is_admin());
CREATE POLICY "all read conquistas" ON public.conquistas FOR SELECT USING (true);
CREATE POLICY "admin manage conquistas" ON public.conquistas FOR ALL USING (public.is_admin());
CREATE POLICY "all read parametros" ON public.parametros FOR SELECT USING (true);
CREATE POLICY "admin manage parametros" ON public.parametros FOR ALL USING (public.is_admin());

-- ============= TRIGGERS =============

-- Classificação automática de pressão + alerta
CREATE OR REPLACE FUNCTION public.classify_pressao()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nome TEXT;
  v_matricula TEXT;
BEGIN
  IF NEW.pressao_sistolica IS NOT NULL AND NEW.pressao_diastolica IS NOT NULL THEN
    IF NEW.pressao_sistolica >= 140 OR NEW.pressao_diastolica >= 90 THEN
      NEW.classificacao_pressao := 'alta';
    ELSIF NEW.pressao_sistolica >= 120 OR NEW.pressao_diastolica >= 80 THEN
      NEW.classificacao_pressao := 'alerta';
    ELSIF NEW.pressao_sistolica < 90 OR NEW.pressao_diastolica < 60 THEN
      NEW.classificacao_pressao := 'baixa';
    ELSE
      NEW.classificacao_pressao := 'normal';
    END IF;

    IF NEW.classificacao_pressao IN ('alta','baixa') THEN
      SELECT nome, matricula INTO v_nome, v_matricula FROM public.profiles WHERE id = NEW.user_id;
      INSERT INTO public.alertas(user_id, nivel_urgencia, tipo, mensagem)
      VALUES (NEW.user_id, 'critico', 'pressao_'||NEW.classificacao_pressao,
        format('%s (mat. %s) registrou pressão %s/%s mmHg — %s', v_nome, v_matricula,
          NEW.pressao_sistolica, NEW.pressao_diastolica, NEW.classificacao_pressao));
    END IF;
  END IF;

  IF array_length(NEW.sintomas,1) > 0 THEN
    SELECT nome, matricula INTO v_nome, v_matricula FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.alertas(user_id, nivel_urgencia, tipo, mensagem)
    VALUES (NEW.user_id, 'atencao', 'sintomas',
      format('%s (mat. %s) reportou sintomas: %s', v_nome, v_matricula, array_to_string(NEW.sintomas,', ')));
  END IF;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_classify_pressao BEFORE INSERT ON public.saude_logs
FOR EACH ROW EXECUTE FUNCTION public.classify_pressao();

-- Pontos & ofensiva no check-in
CREATE OR REPLACE FUNCTION public.handle_checkin_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ultimo DATE; v_ofensiva INT;
BEGIN
  SELECT ultimo_checkin, ofensiva_dias INTO v_ultimo, v_ofensiva FROM public.profiles WHERE id = NEW.user_id;
  IF v_ultimo = NEW.data - INTERVAL '1 day' THEN v_ofensiva := v_ofensiva + 1;
  ELSIF v_ultimo = NEW.data THEN v_ofensiva := v_ofensiva;
  ELSE v_ofensiva := 1;
  END IF;
  UPDATE public.profiles SET pontos_acumulados = pontos_acumulados + 10,
    ofensiva_dias = v_ofensiva, ultimo_checkin = NEW.data, updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_checkin_points AFTER INSERT ON public.checkin_diario
FOR EACH ROW EXECUTE FUNCTION public.handle_checkin_points();

-- Pontos hidratação
CREATE OR REPLACE FUNCTION public.handle_hidratacao_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET pontos_acumulados = pontos_acumulados + 2, updated_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END$$;
CREATE TRIGGER trg_hidratacao_points AFTER INSERT ON public.hidratacao_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_hidratacao_points();

-- Auto-cria profile + role worker no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, matricula, nome, turno, peso, altura, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'matricula', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Trabalhador'),
    COALESCE((NEW.raw_user_meta_data->>'turno')::public.turno, 'diurno'),
    NULLIF(NEW.raw_user_meta_data->>'peso','')::NUMERIC,
    NULLIF(NEW.raw_user_meta_data->>'altura','')::NUMERIC,
    NEW.raw_user_meta_data->>'cargo'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'worker'));
  RETURN NEW;
END$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.saude_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_diario;

-- ============= SEEDS =============
INSERT INTO public.parametros(chave, valor, descricao) VALUES
  ('hidratacao_ml_por_kg', '35', 'ml de água por kg de peso corporal'),
  ('hidratacao_bonus_sol', '500', 'ml extra para exposição ao sol'),
  ('hidratacao_bonus_calor', '500', 'ml extra para clima quente'),
  ('pontos_checkin', '10', 'pontos por check-in diário'),
  ('pontos_hidratacao_meta', '20', 'pontos ao bater meta de hidratação'),
  ('pontos_alongamento', '15', 'pontos por alongamento completo');

INSERT INTO public.desafios(titulo, descricao, meta, duracao_dias, pontos_recompensa, dificuldade) VALUES
  ('Hidratação Consciente', 'Bata sua meta diária de água por 7 dias seguidos.', '7 dias batendo a meta', 7, 70, 'facil'),
  ('Caminhada Saudável', 'Caminhe pelo menos 15 minutos todo dia, durante 14 dias.', '15 min/dia por 14 dias', 14, 120, 'medio'),
  ('Peso Saudável', 'Registre alongamento e check-in todos os dias por 30 dias.', 'Hábitos diários por 30 dias', 30, 300, 'dificil');

INSERT INTO public.recompensas(titulo, descricao, custo_pontos) VALUES
  ('Vale-compras R$ 50', 'Resgate um vale-compras de R$ 50.', 500),
  ('Garrafa térmica Canteiro', 'Garrafa de 1L com a logo Canteiro Saudável.', 250),
  ('Brinde surpresa', 'Kit de brindes da saúde ocupacional.', 150);

INSERT INTO public.avisos(titulo, conteudo, categoria) VALUES
  ('Bem-vindo ao Canteiro Saudável', 'Cuide da sua saúde todos os dias com nosso app. Acumule pontos e troque por prêmios!', 'informativo'),
  ('Onda de calor em Canaã', 'Reforce a hidratação. Tome água de 30 em 30 minutos.', 'urgente'),
  ('Ginástica laboral', 'Lembre-se de fazer alongamento antes de iniciar a jornada.', 'lembrete');

INSERT INTO public.conquistas(codigo, titulo, descricao, icone, pontos) VALUES
  ('hidratacao_iniciante', 'Hidratação Iniciante', 'Bateu a meta de água pela primeira vez', 'droplet', 20),
  ('hidratacao_intermediario', 'Hidratação Intermediária', '7 dias batendo a meta', 'droplets', 50),
  ('mestre_hidratacao', 'Mestre da Hidratação', '30 dias batendo a meta', 'medal', 200),
  ('checkin_sequencia_7', 'Constância Semanal', '7 check-ins seguidos', 'flame', 50),
  ('checkin_sequencia_30', 'Constância Mensal', '30 check-ins seguidos', 'crown', 250);

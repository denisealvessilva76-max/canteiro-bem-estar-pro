
-- Telefone no perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Tabela de check-ins diários por desafio
CREATE TABLE IF NOT EXISTS public.desafio_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  desafio_id UUID NOT NULL,
  progresso_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  foto_url TEXT,
  dificuldade TEXT,
  validado BOOLEAN,
  validado_por UUID,
  validado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(progresso_id, data)
);

ALTER TABLE public.desafio_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own select desafio_checkins" ON public.desafio_checkins FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "own insert desafio_checkins" ON public.desafio_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update desafio_checkins" ON public.desafio_checkins FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Criar usuária admin Denise (idempotente)
DO $$
DECLARE v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'denise.silva@mip.com.br';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'denise.silva@mip.com.br', crypt('CANTEIRO345', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome":"Denise Silva","matricula":"ADM-DENISE","role":"admin"}'::jsonb,
      false, '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'denise.silva@mip.com.br', 'email_verified', true),
      'email', 'denise.silva@mip.com.br', now(), now(), now());
  END IF;

  -- garante perfil + role admin
  INSERT INTO public.profiles (id, matricula, nome, turno)
  VALUES (v_uid, 'ADM-DENISE', 'Denise Silva', 'diurno')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
  ON CONFLICT DO NOTHING;
END$$;

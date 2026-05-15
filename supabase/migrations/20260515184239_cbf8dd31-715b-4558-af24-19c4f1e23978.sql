CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'denise.silva@mip.com.br';
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, recovery_token, email_change_token_new, email_change
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
  ELSE
    -- Reseta senha e garante confirmação de e-mail
    UPDATE auth.users SET
      encrypted_password = crypt('CANTEIRO345', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      aud = 'authenticated',
      role = 'authenticated',
      updated_at = now()
    WHERE id = v_uid;
    -- Garante identity
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_uid AND provider = 'email') THEN
      INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
      VALUES (gen_random_uuid(), v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', 'denise.silva@mip.com.br', 'email_verified', true),
        'email', 'denise.silva@mip.com.br', now(), now(), now());
    END IF;
  END IF;

  INSERT INTO public.profiles (id, matricula, nome, turno)
  VALUES (v_uid, 'ADM-DENISE', 'Denise Silva', 'diurno')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin')
  ON CONFLICT DO NOTHING;
END$$;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'denise.silva@mip.com.br';
  v_password text := 'CANTEIRO345';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')), now(),
      jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
      jsonb_build_object('nome','Denise Silva','role','admin','matricula','ADMIN-001'),
      now(), now(), '', '', '', ''
    );
  ELSE
    UPDATE auth.users
       SET encrypted_password = crypt(v_password, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, now()),
           aud = 'authenticated',
           role = 'authenticated',
           updated_at = now(),
           confirmation_token = '',
           recovery_token = '',
           email_change_token_new = '',
           email_change = ''
     WHERE id = v_user_id;
  END IF;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, v_user_id::text,
          jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO UPDATE
    SET identity_data = EXCLUDED.identity_data, updated_at = now();

  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (id, matricula, nome, turno, cargo)
  VALUES (v_user_id, 'ADMIN-001', 'Denise Silva', 'diurno', 'Saúde Ocupacional')
  ON CONFLICT (id) DO NOTHING;
END $$;
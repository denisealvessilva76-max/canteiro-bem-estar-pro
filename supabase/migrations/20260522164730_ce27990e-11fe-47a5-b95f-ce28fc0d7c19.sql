
CREATE TABLE IF NOT EXISTS public.cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  codigo text NOT NULL UNIQUE,
  marco_tipo text NOT NULL,
  marco_valor integer NOT NULL,
  descricao text NOT NULL,
  valor_desconto integer,
  status text NOT NULL DEFAULT 'disponivel',
  expira_em timestamptz,
  usado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cupons own select" ON public.cupons FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "cupons admin all" ON public.cupons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "cupons own update" ON public.cupons FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS cupons_user_marco_idx ON public.cupons(user_id, marco_tipo, marco_valor);

CREATE OR REPLACE FUNCTION public.gerar_codigo_cupom() RETURNS text
LANGUAGE sql AS $$
  SELECT 'CS-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

CREATE OR REPLACE FUNCTION public.tg_cupons_por_marcos() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  marcos int[] := ARRAY[100, 500, 1000, 2500, 5000];
  m int;
  valores int[] := ARRAY[5, 15, 30, 75, 150];
  i int;
BEGIN
  IF NEW.pontos_acumulados <= COALESCE(OLD.pontos_acumulados, 0) THEN
    RETURN NEW;
  END IF;
  FOR i IN 1..array_length(marcos, 1) LOOP
    m := marcos[i];
    IF NEW.pontos_acumulados >= m AND COALESCE(OLD.pontos_acumulados, 0) < m THEN
      INSERT INTO public.cupons (user_id, codigo, marco_tipo, marco_valor, descricao, valor_desconto, expira_em)
      VALUES (
        NEW.id,
        public.gerar_codigo_cupom(),
        'pontos',
        m,
        'Cupom marco ' || m || ' pontos — R$ ' || valores[i] || ' em produtos no refeitório/loja',
        valores[i],
        now() + interval '90 days'
      )
      ON CONFLICT (user_id, marco_tipo, marco_valor) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_cupons_marcos ON public.profiles;
CREATE TRIGGER trg_cupons_marcos
  AFTER UPDATE OF pontos_acumulados ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_cupons_por_marcos();

REVOKE EXECUTE ON FUNCTION public.gerar_codigo_cupom() FROM anon, authenticated, public;

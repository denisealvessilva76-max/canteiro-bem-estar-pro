
-- secon_chamados
CREATE TABLE public.secon_chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  telefone_discado TEXT NOT NULL DEFAULT '08002850193',
  status TEXT NOT NULL DEFAULT 'pendente',
  comprovante_url TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  gps_capturado_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  comprovado_em TIMESTAMPTZ
);
ALTER TABLE public.secon_chamados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own all secon" ON public.secon_chamados FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin select secon" ON public.secon_chamados FOR SELECT USING (public.is_admin());
CREATE POLICY "admin update secon" ON public.secon_chamados FOR UPDATE USING (public.is_admin());

-- desafio_checkins GPS
ALTER TABLE public.desafio_checkins
  ADD COLUMN IF NOT EXISTS gps_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS gps_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS gps_capturado_em TIMESTAMPTZ;

-- reportes_bug: severidade + componente
ALTER TABLE public.reportes_bug
  ADD COLUMN IF NOT EXISTS severidade TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS componente TEXT;

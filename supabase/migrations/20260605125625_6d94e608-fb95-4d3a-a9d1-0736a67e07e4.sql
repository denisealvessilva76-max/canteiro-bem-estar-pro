
-- 1) Dedupe checkins existentes mantendo o mais antigo do dia
DELETE FROM public.checkin_diario a
USING public.checkin_diario b
WHERE a.user_id = b.user_id
  AND a.data = b.data
  AND a.ctid > b.ctid;

-- 2) Unicidade por (user_id, data) — banco passa a recusar duplicatas
ALTER TABLE public.checkin_diario
  ADD CONSTRAINT checkin_diario_user_data_unique UNIQUE (user_id, data);

-- 3) Remover a tabela de elogios (feature descontinuada)
DROP TABLE IF EXISTS public.elogios CASCADE;


-- Tighten profiles policies: switch role from public -> authenticated
DROP POLICY IF EXISTS "users see own profile" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admins see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "service inserts profiles" ON public.profiles;

CREATE POLICY "users see own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins see all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "service inserts profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- jogo_scores: server-side bounds on submitted scores
ALTER TABLE public.jogo_scores
  DROP CONSTRAINT IF EXISTS jogo_scores_pontos_bounds,
  DROP CONSTRAINT IF EXISTS jogo_scores_acertos_bounds,
  DROP CONSTRAINT IF EXISTS jogo_scores_total_bounds,
  DROP CONSTRAINT IF EXISTS jogo_scores_acertos_le_total;

ALTER TABLE public.jogo_scores
  ADD CONSTRAINT jogo_scores_pontos_bounds  CHECK (pontos  BETWEEN 0 AND 500),
  ADD CONSTRAINT jogo_scores_acertos_bounds CHECK (acertos IS NULL OR acertos BETWEEN 0 AND 100),
  ADD CONSTRAINT jogo_scores_total_bounds   CHECK (total   IS NULL OR total   BETWEEN 0 AND 100),
  ADD CONSTRAINT jogo_scores_acertos_le_total CHECK (acertos IS NULL OR total IS NULL OR acertos <= total);

-- Also tighten jogo_scores policies from public -> authenticated for clarity
DROP POLICY IF EXISTS "own insert jogo_scores" ON public.jogo_scores;
DROP POLICY IF EXISTS "own select jogo_scores" ON public.jogo_scores;
DROP POLICY IF EXISTS "admin update jogo_scores" ON public.jogo_scores;

CREATE POLICY "own insert jogo_scores" ON public.jogo_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own select jogo_scores" ON public.jogo_scores
  FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR public.is_admin());
CREATE POLICY "admin update jogo_scores" ON public.jogo_scores
  FOR UPDATE TO authenticated USING (public.is_admin());

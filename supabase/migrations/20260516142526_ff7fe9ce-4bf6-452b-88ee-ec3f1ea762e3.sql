-- Garante que matrícula seja única (apaga duplicatas mantendo o mais antigo)
DELETE FROM public.profiles a USING public.profiles b
WHERE a.created_at > b.created_at AND a.matricula = b.matricula;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_matricula_unique UNIQUE (matricula);
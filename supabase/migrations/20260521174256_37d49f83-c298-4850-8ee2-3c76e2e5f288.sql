GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkin_diario_unique_user_day
ON public.checkin_diario (user_id, data);
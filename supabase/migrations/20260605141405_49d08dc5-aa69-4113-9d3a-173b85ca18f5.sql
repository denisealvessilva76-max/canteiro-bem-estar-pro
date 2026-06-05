
-- 1) Restrict realtime.messages SELECT (channel subscription) to admins only.
--    The app only uses Realtime in the admin dashboard; workers never subscribe.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT polname FROM pg_policy WHERE polrelid = 'realtime.messages'::regclass LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', r.polname);
  END LOOP;
END $$;

CREATE POLICY "admins can subscribe to realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 2) Revoke EXECUTE on conceder_medalha from regular roles. It is SECURITY DEFINER
--    and is invoked by triggers (which run as table owner), so revoking from
--    authenticated/anon/public does not break app flows but prevents direct RPC abuse.
REVOKE EXECUTE ON FUNCTION public.conceder_medalha(uuid, text) FROM PUBLIC, anon, authenticated;

-- Trigger functions run as their owner from triggers only; they are not API
-- endpoints. Supabase grants EXECUTE to PUBLIC by default, so revoke it.
REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_consigner_login() FROM PUBLIC, anon, authenticated;

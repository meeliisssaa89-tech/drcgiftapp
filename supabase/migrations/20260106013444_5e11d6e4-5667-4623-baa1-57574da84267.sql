-- Drop the security definer view
DROP VIEW IF EXISTS public.admin_stats;

-- Recreate as a regular view (non-security definer)
-- Admin access will be controlled via RLS on the underlying tables
CREATE VIEW public.admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COALESCE(SUM(crystals), 0) FROM public.profiles) as total_crystals,
  (SELECT COUNT(*) FROM public.game_history WHERE created_at > NOW() - INTERVAL '24 hours') as games_today,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
  (SELECT COUNT(*) FROM public.referrals) as total_referrals;
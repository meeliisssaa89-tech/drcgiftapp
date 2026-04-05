-- Add app_icons table for admin icon customization
CREATE TABLE IF NOT EXISTS public.app_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon_key text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  icon_type text NOT NULL DEFAULT 'emoji',
  emoji_value text,
  gif_url text,
  sticker_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_icons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Icons viewable by everyone" ON public.app_icons
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage icons" ON public.app_icons
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default icons
INSERT INTO public.app_icons (icon_key, label, icon_type, emoji_value) VALUES
  ('nav_leaders', 'Leaders Nav', 'emoji', '🏆'),
  ('nav_pvp', 'PvP Nav', 'emoji', '🎮'),
  ('nav_play', 'Play Nav', 'emoji', '🎲'),
  ('nav_tasks', 'Tasks Nav', 'emoji', '🚀'),
  ('nav_profile', 'Profile Nav', 'emoji', '👤'),
  ('currency', 'Currency Icon', 'emoji', '💎'),
  ('spin_button', 'Spin Button', 'emoji', '🎰')
ON CONFLICT (icon_key) DO NOTHING;
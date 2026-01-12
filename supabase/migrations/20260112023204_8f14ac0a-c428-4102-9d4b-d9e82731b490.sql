-- Create tasks table for admin-manageable tasks
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL DEFAULT '📋',
  reward integer NOT NULL DEFAULT 0,
  max_progress integer NOT NULL DEFAULT 1,
  type text NOT NULL DEFAULT 'daily' CHECK (type IN ('daily', 'weekly', 'special')),
  is_active boolean NOT NULL DEFAULT true,
  timer_hours integer DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create game_settings table for admin configuration
CREATE TABLE public.game_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create prizes table for admin-manageable prizes
CREATE TABLE public.prizes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prize_key text NOT NULL UNIQUE,
  name text NOT NULL,
  emoji text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  probability numeric(5,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'crystals' CHECK (type IN ('crystals', 'gift')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create giveaways table
CREATE TABLE public.giveaways (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL DEFAULT '🎁',
  prize_amount integer NOT NULL DEFAULT 0,
  prize_type text NOT NULL DEFAULT 'crystals' CHECK (prize_type IN ('crystals', 'gift')),
  max_participants integer DEFAULT NULL,
  current_participants integer NOT NULL DEFAULT 0,
  start_at timestamp with time zone NOT NULL DEFAULT now(),
  end_at timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  winner_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create giveaway_participants table
CREATE TABLE public.giveaway_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, profile_id)
);

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;

-- RLS for tasks (public read, admin write)
CREATE POLICY "Tasks viewable by everyone" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for game_settings (public read, admin write)
CREATE POLICY "Settings viewable by everyone" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.game_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for prizes (public read, admin write)
CREATE POLICY "Prizes viewable by everyone" ON public.prizes FOR SELECT USING (true);
CREATE POLICY "Admins can manage prizes" ON public.prizes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for giveaways (public read, admin write)
CREATE POLICY "Giveaways viewable by everyone" ON public.giveaways FOR SELECT USING (true);
CREATE POLICY "Admins can manage giveaways" ON public.giveaways FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for giveaway_participants
CREATE POLICY "Participants viewable by everyone" ON public.giveaway_participants FOR SELECT USING (true);
CREATE POLICY "Users can join giveaways" ON public.giveaway_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage participants" ON public.giveaway_participants FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default tasks
INSERT INTO public.tasks (task_key, title, description, emoji, reward, max_progress, type, sort_order) VALUES
('invite_5', 'Invite 5 friends', 'Invite 5 friends with minimum top-up of 10 crystals and get reward!', '👥', 50, 5, 'special', 1),
('daily_reward', 'Daily reward', 'Claim your daily crystals', '🔑', 1, 1, 'daily', 2),
('play_5', 'Play 5 games', 'Play 5 spin games today', '🎲', 5, 5, 'daily', 3),
('play_10', 'Play 10 games', 'Play 10 spin games today', '🎲', 10, 10, 'daily', 4),
('share_stories', 'Share to Stories', 'Share your wins to Telegram Stories', '📱', 5, 1, 'daily', 5);

-- Insert default prizes
INSERT INTO public.prizes (prize_key, name, emoji, value, probability, type, sort_order) VALUES
('crystals_250', 'Crystals', '💎', 250, 0.44, 'crystals', 1),
('trophy', 'Trophy', '🏆', 100, 1.33, 'gift', 2),
('diamond', 'Diamond', '💎', 100, 1.33, 'gift', 3),
('ring', 'Ring', '💍', 100, 1.33, 'gift', 4),
('teddy', 'Teddy Bear', '🧸', 75, 2.5, 'gift', 5),
('champagne', 'Champagne', '🍾', 50, 5, 'gift', 6),
('flower', 'Flower', '🌹', 25, 10, 'gift', 7),
('star', 'Star', '⭐', 10, 15, 'gift', 8),
('nothing', 'Try Again', '💨', 0, 63.07, 'crystals', 9);

-- Insert default game settings
INSERT INTO public.game_settings (key, value, description) VALUES
('spin_cost', '{"amount": 10}', 'Cost per spin in crystals'),
('daily_free_spins', '{"amount": 3}', 'Number of free spins per day'),
('referral_reward', '{"amount": 10}', 'Crystals earned per referral'),
('starting_crystals', '{"amount": 1000}', 'Crystals for new users'),
('level_xp_multiplier', '{"multiplier": 1.5}', 'XP multiplier per level');

-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_settings_updated_at BEFORE UPDATE ON public.game_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON public.prizes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_giveaways_updated_at BEFORE UPDATE ON public.giveaways FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
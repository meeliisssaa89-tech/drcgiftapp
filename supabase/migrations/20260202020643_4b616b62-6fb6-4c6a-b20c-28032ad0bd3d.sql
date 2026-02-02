-- Create pvp_games table for managing PvP game listings
CREATE TABLE public.pvp_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT 'Play & Win Tokens',
  description TEXT,
  image_url TEXT,
  game_url TEXT,
  icon_emoji TEXT NOT NULL DEFAULT '🎮',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pvp_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "PvP games viewable by everyone" 
ON public.pvp_games 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage pvp games" 
ON public.pvp_games 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pvp_games_updated_at
BEFORE UPDATE ON public.pvp_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed Ludo as the first game
INSERT INTO public.pvp_games (name, subtitle, description, icon_emoji, game_url, is_active, sort_order)
VALUES (
  'Ludo',
  'Play & Win Crystals',
  'Classic multiplayer Ludo game. Compete with other players and win crystals!',
  '🎲',
  '/games/ludo',
  true,
  1
);
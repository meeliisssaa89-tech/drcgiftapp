-- Create ludo_games table for game rooms/matches
CREATE TABLE public.ludo_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entry_fee INTEGER NOT NULL DEFAULT 100,
  prize_pool INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled')),
  current_turn UUID,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  game_state JSONB NOT NULL DEFAULT '{
    "player1_tokens": [-1, -1, -1, -1],
    "player2_tokens": [-1, -1, -1, -1],
    "player1_color": "blue",
    "player2_color": "red",
    "last_dice_roll": null,
    "consecutive_sixes": 0,
    "move_history": []
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.ludo_games ENABLE ROW LEVEL SECURITY;

-- Create policies for ludo_games
CREATE POLICY "Ludo games viewable by everyone"
ON public.ludo_games
FOR SELECT
USING (true);

CREATE POLICY "Users can create games"
ON public.ludo_games
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Players can update their games"
ON public.ludo_games
FOR UPDATE
USING (
  player1_id IN (SELECT id FROM profiles) OR
  player2_id IN (SELECT id FROM profiles)
);

-- Create ludo_chat_messages table for in-game chat
CREATE TABLE public.ludo_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.ludo_games(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ludo_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat
CREATE POLICY "Chat messages viewable by game players"
ON public.ludo_chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Players can send messages"
ON public.ludo_chat_messages
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ludo_games_updated_at
BEFORE UPDATE ON public.ludo_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for ludo_games and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_chat_messages;

-- Add ludo_settings to game_settings
INSERT INTO public.game_settings (key, value, description)
VALUES (
  'ludo',
  '{
    "enabled": true,
    "min_entry_fee": 50,
    "max_entry_fee": 10000,
    "default_entry_fee": 100,
    "house_fee_percent": 5
  }'::jsonb,
  'Ludo game settings'
) ON CONFLICT (key) DO NOTHING;
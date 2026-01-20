-- Add telegram_stars setting to game_settings
INSERT INTO public.game_settings (key, value, description)
VALUES (
  'telegram_stars',
  '{"enabled": true, "exchange_rate": 10, "min_deposit": 10, "max_deposit": 10000, "gift_enabled": true}',
  'Telegram Stars deposit settings'
)
ON CONFLICT (key) DO NOTHING;

-- Create telegram_star_deposits table for tracking star deposits
CREATE TABLE IF NOT EXISTS public.telegram_star_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_payment_id TEXT NOT NULL,
  stars_amount INTEGER NOT NULL,
  crystals_credited INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.telegram_star_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view their own star deposits"
ON public.telegram_star_deposits
FOR SELECT
USING (true);

-- Users can insert their own deposits
CREATE POLICY "Users can insert their own star deposits"
ON public.telegram_star_deposits
FOR INSERT
WITH CHECK (true);

-- Create telegram_gifts table for sent gifts
CREATE TABLE IF NOT EXISTS public.telegram_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_telegram_id BIGINT NOT NULL,
  gift_id TEXT NOT NULL,
  stars_cost INTEGER NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_gifts ENABLE ROW LEVEL SECURITY;

-- Users can view their sent gifts
CREATE POLICY "Users can view their sent gifts"
ON public.telegram_gifts
FOR SELECT
USING (true);

-- Users can insert gifts
CREATE POLICY "Users can insert gifts"
ON public.telegram_gifts
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_telegram_star_deposits_profile_id ON public.telegram_star_deposits(profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_gifts_sender_profile_id ON public.telegram_gifts(sender_profile_id);
-- Add Telegram gift fields to giveaways table
ALTER TABLE public.giveaways 
ADD COLUMN IF NOT EXISTS telegram_gift_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_gift_months INTEGER,
ADD COLUMN IF NOT EXISTS telegram_gift_message TEXT;

-- Add currency settings to game_settings (if not exists)
INSERT INTO public.game_settings (key, value, description)
VALUES (
  'currency',
  '{"name": "Crystals", "symbol": "💎", "icon_url": "", "exchange_rate": 1, "min_deposit": 100, "max_deposit": 100000, "deposit_enabled": false, "deposit_instructions": "Connect your wallet to deposit tokens"}'::jsonb,
  'Currency display settings and deposit configuration'
)
ON CONFLICT (key) DO NOTHING;

-- Add wallet settings
INSERT INTO public.game_settings (key, value, description)
VALUES (
  'web3',
  '{"enabled": false, "chain_id": 1, "chain_name": "Ethereum", "token_address": "", "token_symbol": "ETH", "token_decimals": 18, "deposit_address": ""}'::jsonb,
  'Web3 wallet connection and deposit settings'
)
ON CONFLICT (key) DO NOTHING;

-- Create wallet_deposits table for tracking deposits
CREATE TABLE IF NOT EXISTS public.wallet_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  token_symbol TEXT NOT NULL DEFAULT 'ETH',
  crystals_credited INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on wallet_deposits
ALTER TABLE public.wallet_deposits ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_deposits
CREATE POLICY "Users can view own deposits" 
ON public.wallet_deposits 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert deposits" 
ON public.wallet_deposits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage deposits" 
ON public.wallet_deposits 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));
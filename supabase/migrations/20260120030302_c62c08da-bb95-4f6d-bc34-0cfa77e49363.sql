-- Add TON deposit settings if not exists
INSERT INTO public.game_settings (key, value, description)
VALUES (
  'ton_deposit',
  '{"enabled": true, "deposit_address": "", "min_deposit": 0.1, "max_deposit": 1000, "exchange_rate": 100}'::jsonb,
  'TON blockchain deposit settings'
)
ON CONFLICT (key) DO NOTHING;
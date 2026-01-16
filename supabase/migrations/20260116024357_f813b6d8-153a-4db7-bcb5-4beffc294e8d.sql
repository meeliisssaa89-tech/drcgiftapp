-- Add action_url column for tasks that need external links
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS action_url TEXT DEFAULT NULL;

-- Add action_type column to define how task is executed
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'manual';

-- Comment on columns
COMMENT ON COLUMN public.tasks.action_url IS 'External URL for tasks that require opening a link';
COMMENT ON COLUMN public.tasks.action_type IS 'Type of action: manual, play_games, invite, share, claim_daily, external_link';
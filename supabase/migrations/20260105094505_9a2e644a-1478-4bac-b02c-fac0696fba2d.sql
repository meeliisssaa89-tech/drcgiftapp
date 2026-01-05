-- Create profiles table for Telegram users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  crystals INTEGER NOT NULL DEFAULT 1000,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_history table
CREATE TABLE public.game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bet_amount INTEGER NOT NULL,
  prize_amount INTEGER NOT NULL,
  prize_emoji TEXT NOT NULL,
  prize_name TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table to track referral rewards
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Create tasks_progress table
CREATE TABLE public.tasks_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (public read for leaderboards, users manage own)
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

-- RLS Policies for game_history
CREATE POLICY "Game history viewable by everyone" 
ON public.game_history FOR SELECT USING (true);

CREATE POLICY "Users can insert own game history" 
ON public.game_history FOR INSERT WITH CHECK (true);

-- RLS Policies for referrals
CREATE POLICY "Referrals viewable by everyone" 
ON public.referrals FOR SELECT USING (true);

CREATE POLICY "Users can insert referrals" 
ON public.referrals FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own referrals" 
ON public.referrals FOR UPDATE USING (true);

-- RLS Policies for tasks_progress
CREATE POLICY "Task progress viewable by everyone" 
ON public.tasks_progress FOR SELECT USING (true);

CREATE POLICY "Users can insert own task progress" 
ON public.tasks_progress FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own task progress" 
ON public.tasks_progress FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_progress_updated_at
  BEFORE UPDATE ON public.tasks_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX idx_profiles_crystals ON public.profiles(crystals DESC);
CREATE INDEX idx_game_history_profile_id ON public.game_history(profile_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_tasks_progress_profile_id ON public.tasks_progress(profile_id);
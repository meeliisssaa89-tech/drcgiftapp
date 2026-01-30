-- Create PvP Games table
CREATE TABLE IF NOT EXISTS pvp_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player1_name TEXT NOT NULL,
  player2_name TEXT,
  player1_avatar TEXT,
  player2_avatar TEXT,
  bet_amount INTEGER NOT NULL DEFAULT 0,
  player1_spin INTEGER,
  player2_spin INTEGER,
  winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'spinning', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_pvp_games_status ON pvp_games(status);
CREATE INDEX idx_pvp_games_player1_id ON pvp_games(player1_id);
CREATE INDEX idx_pvp_games_player2_id ON pvp_games(player2_id);
CREATE INDEX idx_pvp_games_created_at ON pvp_games(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE pvp_games ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all pvp games" ON pvp_games
  FOR SELECT USING (true);

CREATE POLICY "Users can create pvp games" ON pvp_games
  FOR INSERT WITH CHECK (auth.uid() = player1_id);

CREATE POLICY "Users can update their own pvp games" ON pvp_games
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

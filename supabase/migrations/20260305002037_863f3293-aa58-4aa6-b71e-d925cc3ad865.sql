
-- Create storage bucket for game files
INSERT INTO storage.buckets (id, name, public) VALUES ('game-files', 'game-files', true);

-- Allow anyone to read game files
CREATE POLICY "Game files are publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'game-files');

-- Allow admins to manage game files
CREATE POLICY "Admins can manage game files" ON storage.objects FOR ALL USING (
  bucket_id = 'game-files' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Add game_type column to pvp_games
ALTER TABLE public.pvp_games ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'internal';
-- game_type: 'internal' (built-in), 'hosted' (uploaded files), 'external' (API/URL)

-- Add game_files_path column for hosted games
ALTER TABLE public.pvp_games ADD COLUMN IF NOT EXISTS game_files_path text;

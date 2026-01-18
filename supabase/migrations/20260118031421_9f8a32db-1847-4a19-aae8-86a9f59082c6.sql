-- Create storage bucket for gift images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gifts', 'gifts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view gift images
CREATE POLICY "Gift images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gifts');

-- Allow authenticated users to upload gift images (for admin)
CREATE POLICY "Authenticated users can upload gifts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gifts');

-- Allow authenticated users to update gift images
CREATE POLICY "Authenticated users can update gifts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gifts');

-- Allow authenticated users to delete gift images
CREATE POLICY "Authenticated users can delete gifts"
ON storage.objects FOR DELETE
USING (bucket_id = 'gifts');

-- Add gift_image_url column to giveaways if not exists
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS gift_image_url TEXT;
-- Add RLS policy for public media access
-- This allows unauthenticated users to read media items that are not private

-- Enable RLS on media table if not already enabled
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public media read access" ON media;

-- Create policy for public read access
-- This allows anyone (including unauthenticated users) to read non-private media
CREATE POLICY "Public media read access" ON media
  FOR SELECT
  USING (is_private = false);

-- Make sure authenticated users can still access their own media
DROP POLICY IF EXISTS "Users can view own media" ON media;
CREATE POLICY "Users can view own media" ON media
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own media
DROP POLICY IF EXISTS "Users can insert own media" ON media;
CREATE POLICY "Users can insert own media" ON media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own media
DROP POLICY IF EXISTS "Users can update own media" ON media;
CREATE POLICY "Users can update own media" ON media
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own media
DROP POLICY IF EXISTS "Users can delete own media" ON media;
CREATE POLICY "Users can delete own media" ON media
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment explaining the policy
COMMENT ON POLICY "Public media read access" ON media IS 'Allows unauthenticated users to view media items where is_private is false';

-- Update the getPublicMediaList function comment
COMMENT ON TABLE media IS 'Media library with public/private access control. Non-private media can be viewed without authentication.';
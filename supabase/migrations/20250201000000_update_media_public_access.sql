-- Update media table policies to ensure public access works correctly

-- Drop existing select policy
DROP POLICY IF EXISTS "Anyone can view media" ON media;

-- Create new policy that explicitly allows anonymous access
CREATE POLICY "Public can view all media" ON media
  FOR SELECT 
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Add a comment to clarify the intent
COMMENT ON POLICY "Public can view all media" ON media IS 'Allows public/anonymous users to view all media items without authentication';
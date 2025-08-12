-- Add status and generation fields to user_media table

-- Add status enum type
CREATE TYPE media_status AS ENUM ('queued', 'generating', 'generated', 'published', 'failed', 'rejected');

-- Add new columns to user_media
ALTER TABLE user_media
ADD COLUMN status media_status DEFAULT 'published',
ADD COLUMN generation_data JSONB,
ADD COLUMN generated_at TIMESTAMPTZ,
ADD COLUMN published_at TIMESTAMPTZ,
ADD COLUMN error_message TEXT;

-- Create indexes for efficient filtering
CREATE INDEX idx_user_media_status ON user_media(status);
CREATE INDEX idx_user_media_user_status ON user_media(user_id, status);
CREATE INDEX idx_user_media_generation_data ON user_media USING GIN (generation_data);

-- Update existing records to have 'published' status
UPDATE user_media 
SET status = 'published', 
    published_at = created_at 
WHERE status IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN user_media.status IS 'Status of the media item in the generation/approval workflow';
COMMENT ON COLUMN user_media.generation_data IS 'JSON data containing prompt, settings, and other generation metadata';
COMMENT ON COLUMN user_media.generated_at IS 'Timestamp when the image was generated';
COMMENT ON COLUMN user_media.published_at IS 'Timestamp when the image was approved/published';
COMMENT ON COLUMN user_media.error_message IS 'Error message if generation failed';

-- Enable Realtime for user_media table
ALTER PUBLICATION supabase_realtime ADD TABLE user_media;

-- Update RLS policies to handle status
-- Users can see their own media in any status
DROP POLICY IF EXISTS "Users can view their own media" ON user_media;
CREATE POLICY "Users can view their own media" ON user_media
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own unpublished media
DROP POLICY IF EXISTS "Users can update their own media" ON user_media;
CREATE POLICY "Users can update their own media" ON user_media
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to safely transition media status
CREATE OR REPLACE FUNCTION transition_media_status(
  media_id UUID,
  new_status media_status
) RETURNS BOOLEAN AS $$
DECLARE
  current_status media_status;
  user_id_check UUID;
BEGIN
  -- Get current status and user_id
  SELECT status, user_id INTO current_status, user_id_check
  FROM user_media
  WHERE id = media_id;
  
  -- Check if user owns the media
  IF user_id_check != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  -- Validate status transitions
  CASE
    WHEN current_status = 'queued' AND new_status IN ('generating', 'failed') THEN
      -- Valid transition
    WHEN current_status = 'generating' AND new_status IN ('generated', 'failed') THEN
      -- Valid transition
    WHEN current_status = 'generated' AND new_status IN ('published', 'rejected') THEN
      -- Valid transition
    WHEN current_status = 'failed' AND new_status = 'queued' THEN
      -- Allow retry
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Update the status
  UPDATE user_media
  SET 
    status = new_status,
    updated_at = NOW(),
    published_at = CASE WHEN new_status = 'published' THEN NOW() ELSE published_at END
  WHERE id = media_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
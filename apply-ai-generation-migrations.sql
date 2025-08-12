-- Combined AI Generation Migration Script
-- Run this in Supabase SQL Editor

-- 1. First, add status enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_status') THEN
        CREATE TYPE media_status AS ENUM ('queued', 'generating', 'generated', 'published', 'failed', 'rejected');
    END IF;
END$$;

-- 2. Add fields to user_media table
ALTER TABLE user_media
ADD COLUMN IF NOT EXISTS status media_status DEFAULT 'published',
ADD COLUMN IF NOT EXISTS generation_data JSONB,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Add fields to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
ADD COLUMN IF NOT EXISTS generation_data jsonb,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS generated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS generated_at timestamptz,
ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 4. Add status constraint to media table
ALTER TABLE media 
DROP CONSTRAINT IF EXISTS media_status_check;

ALTER TABLE media 
ADD CONSTRAINT media_status_check 
CHECK (status IN ('queued', 'generating', 'generated', 'published', 'failed', 'rejected'));

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_media_status ON user_media(status);
CREATE INDEX IF NOT EXISTS idx_user_media_user_status ON user_media(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_media_generation_data ON user_media USING GIN (generation_data);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_generated_by ON media(generated_by);
CREATE INDEX IF NOT EXISTS idx_media_generation_data ON media USING GIN(generation_data);

-- 6. Update existing records
UPDATE user_media 
SET status = 'published', published_at = created_at 
WHERE status IS NULL;

UPDATE media 
SET status = 'published', published_at = created_at 
WHERE status IS NULL;

-- 7. Enable Realtime
-- First, check if tables are already in publication and add them if not
DO $$ 
BEGIN
    -- Add user_media if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'user_media'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_media;
    END IF;
    
    -- Add media if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'media'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE media;
    END IF;
END$$;

-- 8. Create transition function for user_media
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

-- 9. Create transition function for media table
CREATE OR REPLACE FUNCTION transition_global_media_status(
  media_id UUID,
  new_status TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update media table
  UPDATE media
  SET 
    status = new_status,
    published_at = CASE WHEN new_status = 'published' THEN NOW() ELSE published_at END,
    updated_at = NOW()
  WHERE id = media_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Media item not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update RLS policies
DROP POLICY IF EXISTS "Users can view their own media" ON user_media;
CREATE POLICY "Users can view their own media" ON user_media
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own media" ON user_media;
CREATE POLICY "Users can update their own media" ON user_media
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Grant permissions
GRANT SELECT ON media TO anon;
GRANT ALL ON media TO authenticated;
GRANT EXECUTE ON FUNCTION transition_media_status TO authenticated;
GRANT EXECUTE ON FUNCTION transition_global_media_status TO authenticated;

-- 12. Add comments
COMMENT ON COLUMN user_media.status IS 'Status of the media item in the generation/approval workflow';
COMMENT ON COLUMN user_media.generation_data IS 'JSON data containing prompt, settings, and other generation metadata';
COMMENT ON COLUMN user_media.generated_at IS 'Timestamp when the image was generated';
COMMENT ON COLUMN user_media.published_at IS 'Timestamp when the image was approved/published';
COMMENT ON COLUMN user_media.error_message IS 'Error message if generation failed';

COMMENT ON COLUMN media.status IS 'Status of the media item in the generation/approval workflow';
COMMENT ON COLUMN media.generation_data IS 'JSON data containing prompt, settings, and other generation metadata';
COMMENT ON COLUMN media.generated_at IS 'Timestamp when the image was generated';
COMMENT ON COLUMN media.published_at IS 'Timestamp when the image was approved/published';
COMMENT ON COLUMN media.error_message IS 'Error message if generation failed';
COMMENT ON COLUMN media.generated_by IS 'User who generated this image';

-- Done! The AI generation fields are now ready.
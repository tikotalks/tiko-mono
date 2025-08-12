-- Add generation fields to media table to match user_media
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published',
ADD COLUMN IF NOT EXISTS generation_data jsonb,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS generated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS generated_at timestamptz,
ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Add check constraint for status
ALTER TABLE media 
DROP CONSTRAINT IF EXISTS media_status_check;

ALTER TABLE media 
ADD CONSTRAINT media_status_check 
CHECK (status IN ('queued', 'generating', 'generated', 'published', 'failed', 'rejected'));

-- Since we already have transition_media_status function from previous migration,
-- we'll create a separate function for the media table
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

-- Enable Realtime for media table
ALTER PUBLICATION supabase_realtime ADD TABLE media;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_generated_by ON media(generated_by);
CREATE INDEX IF NOT EXISTS idx_media_generation_data ON media USING GIN(generation_data);

-- Grant permissions
GRANT SELECT ON media TO anon;
GRANT ALL ON media TO authenticated;
GRANT EXECUTE ON FUNCTION transition_global_media_status TO authenticated;
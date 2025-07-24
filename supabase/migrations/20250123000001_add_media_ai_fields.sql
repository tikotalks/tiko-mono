-- Add AI-generated fields to media table
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_analyzed boolean DEFAULT false;

-- Create index for tag searches
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN (tags);

-- Create a function to search media by tags
CREATE OR REPLACE FUNCTION search_media_by_tags(search_tags text[])
RETURNS SETOF media AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM media
  WHERE tags && search_tags
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
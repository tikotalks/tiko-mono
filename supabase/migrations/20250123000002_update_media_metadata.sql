-- Update media table with comprehensive metadata
ALTER TABLE media 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_media_name ON media(name);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
CREATE INDEX IF NOT EXISTS idx_media_categories ON media USING GIN (categories);

-- Update the name field for existing records to use filename without extension
UPDATE media 
SET name = regexp_replace(original_filename, '\.[^.]+$', '')
WHERE name IS NULL;

-- Create a comprehensive search function
CREATE OR REPLACE FUNCTION search_media(
  search_query text DEFAULT NULL,
  search_tags text[] DEFAULT NULL,
  search_categories text[] DEFAULT NULL
)
RETURNS SETOF media AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM media
  WHERE 
    (search_query IS NULL OR 
     name ILIKE '%' || search_query || '%' OR
     title ILIKE '%' || search_query || '%' OR
     description ILIKE '%' || search_query || '%')
    AND
    (search_tags IS NULL OR tags && search_tags)
    AND
    (search_categories IS NULL OR categories && search_categories)
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
-- Complete media table setup with all fields

-- Create media table for tracking uploaded files
CREATE TABLE IF NOT EXISTS media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- File information
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  
  -- URLs
  original_url text NOT NULL,
  thumbnail_url text,
  medium_url text,
  
  -- Metadata
  name text,
  title text,
  description text,
  tags text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  ai_analyzed boolean DEFAULT false,
  width integer,
  height integer,
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_media_categories ON media USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_media_name ON media(name);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);

-- Enable RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Policies for media table
-- Users can view all media (for now - you might want to restrict this)
CREATE POLICY "Anyone can view media" ON media
  FOR SELECT USING (true);

-- Only editors and admins can upload media
CREATE POLICY "Editors and admins can insert media" ON media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('editor', 'admin')
    )
  );

-- Users can update their own media, admins can update any
CREATE POLICY "Users can update own media, admins can update any" ON media
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users can delete their own media, admins can delete any
CREATE POLICY "Users can delete own media, admins can delete any" ON media
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
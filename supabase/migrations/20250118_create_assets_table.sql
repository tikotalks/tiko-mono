-- Create assets table for storing file metadata
-- Files themselves are stored in Cloudflare R2 bucket

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic file information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Path in R2 bucket
  file_size INTEGER NOT NULL, -- File size in bytes
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(10) NOT NULL,
  
  -- Categorization
  categories TEXT[], -- Array of category strings
  tags TEXT[], -- Array of tag strings
  
  -- File metadata
  width INTEGER, -- For images/videos
  height INTEGER, -- For images/videos
  duration INTEGER, -- For audio/video files in seconds
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX assets_user_id_idx ON assets(user_id);
CREATE INDEX assets_is_public_idx ON assets(is_public);
CREATE INDEX assets_mime_type_idx ON assets(mime_type);
CREATE INDEX assets_categories_idx ON assets USING GIN(categories);
CREATE INDEX assets_tags_idx ON assets USING GIN(tags);
CREATE INDEX assets_created_at_idx ON assets(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public assets can be read by anyone
CREATE POLICY "Public assets are viewable by everyone" ON assets
  FOR SELECT USING (is_public = true);

-- Users can read their own assets
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own assets
CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets
CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own assets
CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything (adjust email domain as needed)
CREATE POLICY "Admins can manage all assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%@admin.tiko.app'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
-- Migration: Create Radio App Tables
-- Created: 2025-07-08
-- Description: Creates radio_items and radio_settings tables with RLS policies

-- Radio items table
CREATE TABLE radio_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'vimeo', 'local', 'url')),
  thumbnail_url TEXT,
  custom_thumbnail_url TEXT,
  duration_seconds INTEGER,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Radio settings table
CREATE TABLE radio_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  autoplay_next BOOLEAN DEFAULT true,
  show_titles BOOLEAN DEFAULT true,
  default_volume NUMERIC DEFAULT 0.8 CHECK (default_volume >= 0 AND default_volume <= 1),
  sleep_timer_minutes INTEGER DEFAULT 30,
  shuffle_mode BOOLEAN DEFAULT false,
  repeat_mode TEXT DEFAULT 'none' CHECK (repeat_mode IN ('none', 'one', 'all')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE radio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radio_items
CREATE POLICY "Users can view their own radio items" 
ON radio_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own radio items" 
ON radio_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own radio items" 
ON radio_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own radio items" 
ON radio_items FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for radio_settings
CREATE POLICY "Users can view their own radio settings" 
ON radio_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own radio settings" 
ON radio_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own radio settings" 
ON radio_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_radio_items_user_id ON radio_items(user_id);
CREATE INDEX idx_radio_items_sort_order ON radio_items(sort_order);
CREATE INDEX idx_radio_items_created_at ON radio_items(created_at);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_radio_items_updated_at 
    BEFORE UPDATE ON radio_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radio_settings_updated_at 
    BEFORE UPDATE ON radio_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
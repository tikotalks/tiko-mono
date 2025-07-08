-- Create user_profiles table for parent mode functionality
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_pin_hash TEXT,
  parent_mode_enabled BOOLEAN DEFAULT false,
  parent_mode_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies for all tables
DROP POLICY IF EXISTS "Users can view their own radio settings" ON radio_settings;
DROP POLICY IF EXISTS "Users can insert their own radio settings" ON radio_settings;
DROP POLICY IF EXISTS "Users can update their own radio settings" ON radio_settings;

DROP POLICY IF EXISTS "Users can view their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can insert their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can update their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can delete their own radio items" ON radio_items;

-- Create permissive policies for all tables
CREATE POLICY "Enable all for radio_settings for authenticated users"
ON radio_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for radio_items for authenticated users"
ON radio_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all for user_profiles for authenticated users"
ON user_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Add update trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Add parent mode columns to user_profiles table if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS parent_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS parent_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_mode_settings JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_mode_enabled ON user_profiles(parent_mode_enabled);

-- Update RLS policies to include parent mode fields
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
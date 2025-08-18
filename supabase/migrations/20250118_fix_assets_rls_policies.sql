-- Fix assets RLS policies to avoid querying auth.users table
-- This prevents "permission denied for table users" errors

-- Drop existing policies
DROP POLICY IF EXISTS "Public assets are viewable by everyone" ON assets;
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON assets;  
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON assets;
DROP POLICY IF EXISTS "Admins can manage all assets" ON assets;

-- Create new simplified policies

-- Public assets can be read by anyone (no auth required)
CREATE POLICY "Public assets are viewable by everyone" ON assets
  FOR SELECT USING (is_public = true);

-- Users can read their own assets (when authenticated)
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own assets (when authenticated)
CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own assets (when authenticated)  
CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own assets (when authenticated)
CREATE POLICY "Users can delete own assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all assets (for admin operations)
-- This uses jwt claims instead of querying auth.users
CREATE POLICY "Service role can manage all assets" ON assets
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );
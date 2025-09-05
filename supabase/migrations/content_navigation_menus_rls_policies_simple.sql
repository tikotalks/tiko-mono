-- Simple RLS Policies for content_navigation_menus table
-- This version doesn't require access to the auth.users table

-- Enable RLS on the table (if not already enabled)
ALTER TABLE content_navigation_menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable update for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON content_navigation_menus;

-- Option 1: Allow all authenticated users (temporary for testing)
-- Uncomment this section if you want to test without role restrictions
/*
CREATE POLICY "Enable all operations for authenticated users" 
ON content_navigation_menus 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
*/

-- Option 2: Check admin role in JWT only (no auth.users table access)
-- Policy 1: Allow all authenticated users to read
CREATE POLICY "Enable read access for all authenticated users" 
ON content_navigation_menus 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow only admins to insert (check JWT only)
CREATE POLICY "Enable insert for admin users only" 
ON content_navigation_menus 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Check various possible locations for role in JWT
  (auth.jwt()->>'role') = 'admin'
  OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
);

-- Policy 3: Allow only admins to update
CREATE POLICY "Enable update for admin users only" 
ON content_navigation_menus 
FOR UPDATE 
TO authenticated 
USING (
  (auth.jwt()->>'role') = 'admin'
  OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
)
WITH CHECK (
  (auth.jwt()->>'role') = 'admin'
  OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
);

-- Policy 4: Allow only admins to delete
CREATE POLICY "Enable delete for admin users only" 
ON content_navigation_menus 
FOR DELETE 
TO authenticated 
USING (
  (auth.jwt()->>'role') = 'admin'
  OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
  OR (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
);

-- To debug: Check what's in your JWT token
-- Run this separately to see the structure:
-- SELECT auth.jwt();

-- To check current policies:
-- SELECT * FROM pg_policies WHERE tablename = 'content_navigation_menus';
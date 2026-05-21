-- RLS Policies for content_navigation_menus table
-- This file sets up row-level security policies for navigation menu management

-- Enable RLS on the table (if not already enabled)
ALTER TABLE content_navigation_menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable update for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON content_navigation_menus;

-- Policy 1: Allow all authenticated users to read navigation menus
CREATE POLICY "Enable read access for all authenticated users" 
ON content_navigation_menus 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow only admins to insert new navigation menus
-- Note: Adjust the role check based on your auth setup
-- Option A: If using Supabase Auth with custom claims
CREATE POLICY "Enable insert for admin users only" 
ON content_navigation_menus 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Check if user has admin role in JWT claims
  (auth.jwt()->>'role') = 'admin'
  OR 
  -- Alternative: check in raw_user_meta_data
  (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
  OR
  -- Alternative: check if user exists in an admins table
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 3: Allow only admins to update navigation menus
CREATE POLICY "Enable update for admin users only" 
ON content_navigation_menus 
FOR UPDATE 
TO authenticated 
USING (
  -- Same admin check as insert
  (auth.jwt()->>'role') = 'admin'
  OR 
  (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  -- Same admin check for the new row
  (auth.jwt()->>'role') = 'admin'
  OR 
  (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Policy 4: Allow only admins to delete navigation menus
CREATE POLICY "Enable delete for admin users only" 
ON content_navigation_menus 
FOR DELETE 
TO authenticated 
USING (
  -- Same admin check as insert/update
  (auth.jwt()->>'role') = 'admin'
  OR 
  (auth.jwt()->'raw_user_meta_data'->>'role') = 'admin'
  OR
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Alternative simpler approach if you just want to allow all authenticated users
-- (uncomment below and comment out the admin-specific policies above)
/*
CREATE POLICY "Enable all operations for authenticated users" 
ON content_navigation_menus 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
*/

-- To check current policies after running this script:
-- SELECT * FROM pg_policies WHERE tablename = 'content_navigation_menus';
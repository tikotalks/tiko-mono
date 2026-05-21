-- Admin-only RLS Policies for content_navigation_menus table
-- Uses the user_profiles table to check for admin role

-- Enable RLS on the table (if not already enabled)
ALTER TABLE content_navigation_menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable insert for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable update for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON content_navigation_menus;

-- Policy 1: Allow all authenticated users to READ navigation menus
-- (Frontend apps need to read navigation menus)
CREATE POLICY "Enable read access for all authenticated users" 
ON content_navigation_menus 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Allow only admins to INSERT new navigation menus
CREATE POLICY "Enable insert for admin users only" 
ON content_navigation_menus 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy 3: Allow only admins to UPDATE navigation menus
CREATE POLICY "Enable update for admin users only" 
ON content_navigation_menus 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Policy 4: Allow only admins to DELETE navigation menus
CREATE POLICY "Enable delete for admin users only" 
ON content_navigation_menus 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Grant necessary permissions on user_profiles table for RLS to work
GRANT SELECT ON public.user_profiles TO authenticated;

-- To verify policies are working correctly:
-- SELECT * FROM pg_policies WHERE tablename = 'content_navigation_menus';

-- To check if current user is admin:
-- SELECT EXISTS (
--   SELECT 1 FROM public.user_profiles 
--   WHERE user_profiles.user_id = auth.uid() 
--   AND user_profiles.role = 'admin'
-- ) as is_admin;
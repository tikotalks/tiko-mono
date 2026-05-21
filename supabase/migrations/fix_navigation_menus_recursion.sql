-- Fix infinite recursion in navigation menu RLS policies
-- This approach avoids the recursion by using a security definer function

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Enable insert for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable update for admin users only" ON content_navigation_menus;
DROP POLICY IF EXISTS "Enable delete for admin users only" ON content_navigation_menus;

-- Create a security definer function to check if user is admin
-- This bypasses RLS on user_profiles table
CREATE OR REPLACE FUNCTION auth.user_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = $1 
    AND user_profiles.role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth.user_is_admin(uuid) TO authenticated;

-- Now create policies using the function
CREATE POLICY "Enable insert for admin users only" 
ON content_navigation_menus 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.user_is_admin(auth.uid()));

CREATE POLICY "Enable update for admin users only" 
ON content_navigation_menus 
FOR UPDATE 
TO authenticated 
USING (auth.user_is_admin(auth.uid()))
WITH CHECK (auth.user_is_admin(auth.uid()));

CREATE POLICY "Enable delete for admin users only" 
ON content_navigation_menus 
FOR DELETE 
TO authenticated 
USING (auth.user_is_admin(auth.uid()));

-- The read policy remains the same (no recursion issue)
-- It should already exist, but let's ensure it's there
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON content_navigation_menus;
CREATE POLICY "Enable read access for all authenticated users" 
ON content_navigation_menus 
FOR SELECT 
TO authenticated 
USING (true);

-- Verify the function works
-- SELECT auth.user_is_admin(auth.uid()) as is_admin;
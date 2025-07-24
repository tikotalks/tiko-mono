-- Create a secure function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role for the currently authenticated user
  SELECT role INTO user_role
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  -- Return the role or 'user' if not found
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Create a function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO user_role
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  -- Check if user has the required role or higher
  IF user_role = 'admin' THEN
    -- Admin has all permissions
    RETURN true;
  ELSIF user_role = 'editor' AND required_role = 'editor' THEN
    -- Editor has editor permissions
    RETURN true;
  ELSIF required_role = 'user' THEN
    -- Everyone has user permissions
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
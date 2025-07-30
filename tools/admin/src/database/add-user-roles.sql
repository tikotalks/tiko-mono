-- Add role and is_active columns to user_profiles table
-- This is required for the translation system authentication

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('user', 'editor', 'admin'));
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Update existing users to have 'user' role if null
UPDATE user_profiles 
SET role = 'user' 
WHERE role IS NULL;

-- Grant permissions to authenticated users to read user_profiles
GRANT SELECT ON user_profiles TO authenticated;

-- Create RPC function to get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM user_profiles
    WHERE user_id = auth.uid()
    AND is_active = true;
    
    -- Return 'user' as default if no profile exists
    RETURN COALESCE(v_role, 'user');
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_my_role TO authenticated;

-- Make a specific user an admin (replace with actual email)
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- Output current user roles for verification
SELECT 
    u.email,
    up.role,
    up.is_active
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.email;
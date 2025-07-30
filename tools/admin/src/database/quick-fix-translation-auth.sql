-- Quick fix for translation authentication issues
-- Run this to ensure the translation admin can access the database

-- 1. First ensure user_profiles has the required columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('user', 'editor', 'admin'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE user_profiles 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Ensure all authenticated users have a user profile
INSERT INTO user_profiles (user_id, role, is_active)
SELECT id, 'user', true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Update RLS policies to be more permissive for authenticated users
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Approved translations are viewable by all authenticated users" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Users can view their own translations" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Admins can view all translations" ON i18n_translation_versions;

-- Create simple policy: authenticated users can read all translations
CREATE POLICY "Authenticated users can read all translations" 
ON i18n_translation_versions
FOR SELECT 
TO authenticated
USING (true);

-- 4. Grant permissions on all translation views
GRANT SELECT ON i18n_locale_details TO authenticated;
GRANT SELECT ON i18n_locale_details TO anon;
GRANT SELECT ON i18n_translations TO authenticated;
GRANT SELECT ON i18n_translations TO anon;
GRANT SELECT ON i18n_pending_translations TO authenticated;
GRANT SELECT ON i18n_translation_history TO authenticated;
GRANT SELECT ON i18n_contributors TO authenticated;

-- 5. Grant permissions on base tables
GRANT SELECT ON i18n_languages TO authenticated;
GRANT SELECT ON i18n_languages TO anon;
GRANT SELECT ON i18n_locales TO authenticated;
GRANT SELECT ON i18n_locales TO anon;
GRANT SELECT, INSERT, UPDATE ON i18n_translation_versions TO authenticated;

-- 6. Grant permissions on user_profiles for reading
GRANT SELECT ON user_profiles TO authenticated;

-- 7. Ensure RPC functions are accessible
GRANT EXECUTE ON FUNCTION create_translation_version TO authenticated;
GRANT EXECUTE ON FUNCTION approve_translation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_translation TO authenticated;
GRANT EXECUTE ON FUNCTION get_locale_hierarchy TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_role TO authenticated;

-- 8. Create a simple anon-accessible view for runtime translation loading
CREATE OR REPLACE VIEW public.i18n_runtime_translations AS
SELECT 
    key,
    locale,
    value,
    auto_translated
FROM i18n_translations;

-- Grant anon access to runtime translations
GRANT SELECT ON i18n_runtime_translations TO anon;

-- 9. Set a user as admin (replace email with your admin email)
-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 10. Show current status
SELECT 'Current authenticated users and their roles:' as info;
SELECT 
    u.email,
    up.role,
    up.is_active,
    u.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
ORDER BY u.created_at DESC
LIMIT 10;
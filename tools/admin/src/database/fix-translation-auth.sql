-- Fix authentication for translation admin interface
-- This ensures authenticated users can properly access translation data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Approved translations are viewable by all authenticated users" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Users can view their own translations" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Admins can view all translations" ON i18n_translation_versions;

-- Create comprehensive read policies
-- 1. Anyone (including anon) can read approved translations
CREATE POLICY "Anyone can read approved translations" 
ON i18n_translation_versions
FOR SELECT 
USING (status = 'approved');

-- 2. Authenticated users can read all translation data (for admin interface)
CREATE POLICY "Authenticated users can read all translations" 
ON i18n_translation_versions
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Users can always read their own translations
CREATE POLICY "Users can read their own translations" 
ON i18n_translation_versions
FOR SELECT 
USING (created_by = auth.uid());

-- Update policies for managing translations
DROP POLICY IF EXISTS "Authenticated users can create pending translations" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Only admins can update translation status" ON i18n_translation_versions;
DROP POLICY IF EXISTS "Users can update their own pending translations" ON i18n_translation_versions;

-- Create new management policies
-- 1. Any authenticated user can create translations (controlled by RPC function)
CREATE POLICY "Authenticated users can create translations" 
ON i18n_translation_versions
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 2. Admin/editor users can update any translation
CREATE POLICY "Admin users can update any translation" 
ON i18n_translation_versions
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- 3. Regular users can update their own pending translations
CREATE POLICY "Users can update their own pending translations" 
ON i18n_translation_versions
FOR UPDATE 
USING (
    created_by = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    created_by = auth.uid() 
    AND status = 'pending'
);

-- 4. Only admins can delete translations
CREATE POLICY "Only admins can delete translations" 
ON i18n_translation_versions
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Grant necessary permissions to authenticated role
GRANT SELECT ON i18n_languages TO authenticated;
GRANT SELECT ON i18n_locales TO authenticated;
GRANT SELECT, INSERT, UPDATE ON i18n_translation_versions TO authenticated;
GRANT SELECT ON i18n_translation_versions TO anon;

-- Grant access to views
GRANT SELECT ON i18n_translations TO authenticated;
GRANT SELECT ON i18n_translations TO anon;
GRANT SELECT ON i18n_locale_details TO authenticated;
GRANT SELECT ON i18n_locale_details TO anon;
GRANT SELECT ON i18n_pending_translations TO authenticated;
GRANT SELECT ON i18n_translation_history TO authenticated;
GRANT SELECT ON i18n_contributors TO authenticated;

-- Ensure RPC functions are accessible
GRANT EXECUTE ON FUNCTION create_translation_version TO authenticated;
GRANT EXECUTE ON FUNCTION approve_translation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_translation TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_translation TO authenticated;

-- Create a function to check if user can manage translations
CREATE OR REPLACE FUNCTION can_manage_translations()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.role() != 'authenticated' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin or editor role
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'editor')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION can_manage_translations TO authenticated;
-- Fix infinite recursion in i18n RLS policies
-- The issue is that the i18n policies check user_profiles which has its own RLS policies

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Languages are writable by admins" ON i18n_languages;
DROP POLICY IF EXISTS "Translation keys are writable by editors and admins" ON i18n_keys;
DROP POLICY IF EXISTS "All translations are readable by editors and admins" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are writable by editors and admins" ON i18n_translations;

-- Drop the problematic trigger too
DROP TRIGGER IF EXISTS trigger_auto_publish_admin_translations ON i18n_translations;
DROP FUNCTION IF EXISTS auto_publish_admin_translations();

-- Create simpler policies that don't cause recursion
-- For now, we'll use authenticated users instead of checking roles

-- Languages: Everyone can read, authenticated users can modify
CREATE POLICY "Languages are writable by authenticated users" 
ON i18n_languages FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Translation keys: Everyone can read, authenticated users can create/modify
CREATE POLICY "Translation keys are writable by authenticated users" 
ON i18n_keys FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Translations: Authenticated users can read all and write
CREATE POLICY "All translations are readable by authenticated users" 
ON i18n_translations FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Translations are writable by authenticated users" 
ON i18n_translations FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Translations are updatable by authenticated users" 
ON i18n_translations FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Translations are deletable by authenticated users" 
ON i18n_translations FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT ALL ON i18n_languages TO authenticated;
GRANT ALL ON i18n_keys TO authenticated;
GRANT ALL ON i18n_translations TO authenticated;
GRANT USAGE ON SEQUENCE i18n_languages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_keys_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_translations_id_seq TO authenticated;

-- Also grant to anon for read access
GRANT SELECT ON i18n_languages TO anon;
GRANT SELECT ON i18n_keys TO anon;
GRANT SELECT ON i18n_translations TO anon;
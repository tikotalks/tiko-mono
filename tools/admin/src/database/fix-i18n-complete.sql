-- Complete fix for i18n RLS policies
-- This script drops ALL existing policies first, then recreates them properly

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all policies on i18n_languages
DROP POLICY IF EXISTS "Languages are readable by everyone" ON i18n_languages;
DROP POLICY IF EXISTS "Languages are writable by admins" ON i18n_languages;
DROP POLICY IF EXISTS "Languages are writable by authenticated users" ON i18n_languages;

-- Drop all policies on i18n_keys
DROP POLICY IF EXISTS "Translation keys are readable by everyone" ON i18n_keys;
DROP POLICY IF EXISTS "Translation keys are writable by editors and admins" ON i18n_keys;
DROP POLICY IF EXISTS "Translation keys are writable by authenticated users" ON i18n_keys;

-- Drop all policies on i18n_translations
DROP POLICY IF EXISTS "Published translations are readable by everyone" ON i18n_translations;
DROP POLICY IF EXISTS "All translations are readable by editors and admins" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are writable by editors and admins" ON i18n_translations;
DROP POLICY IF EXISTS "All translations are readable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are writable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are updatable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are deletable by authenticated users" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are updatable by editors and admins" ON i18n_translations;
DROP POLICY IF EXISTS "Translations are deletable by editors and admins" ON i18n_translations;

-- Drop trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_auto_publish_admin_translations ON i18n_translations;
DROP FUNCTION IF EXISTS auto_publish_admin_translations();

-- ============================================
-- 2. CREATE NEW SIMPLIFIED POLICIES
-- ============================================

-- For now, let's use simple authenticated user policies to avoid recursion

-- Languages: Everyone can read, authenticated users can write
CREATE POLICY "Anyone can read languages" 
ON i18n_languages FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert languages" 
ON i18n_languages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update languages" 
ON i18n_languages FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete languages" 
ON i18n_languages FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Translation keys: Everyone can read, authenticated users can write
CREATE POLICY "Anyone can read translation keys" 
ON i18n_keys FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert keys" 
ON i18n_keys FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update keys" 
ON i18n_keys FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete keys" 
ON i18n_keys FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Translations: Everyone can read published, authenticated users can manage all
CREATE POLICY "Anyone can read published translations" 
ON i18n_translations FOR SELECT 
USING (is_published = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert translations" 
ON i18n_translations FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update translations" 
ON i18n_translations FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete translations" 
ON i18n_translations FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

-- Grant to authenticated role
GRANT ALL ON i18n_languages TO authenticated;
GRANT ALL ON i18n_keys TO authenticated;
GRANT ALL ON i18n_translations TO authenticated;
GRANT USAGE ON SEQUENCE i18n_languages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_keys_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_translations_id_seq TO authenticated;

-- Grant read access to anon
GRANT SELECT ON i18n_languages TO anon;
GRANT SELECT ON i18n_keys TO anon;
GRANT SELECT ON i18n_translations TO anon;

-- ============================================
-- 4. TEST THE POLICIES
-- ============================================

-- You can test by running these queries:
-- SELECT * FROM i18n_languages;
-- SELECT * FROM i18n_keys;
-- SELECT * FROM i18n_translations;
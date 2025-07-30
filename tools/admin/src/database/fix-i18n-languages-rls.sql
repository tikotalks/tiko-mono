-- Quick fix for i18n_languages RLS issues

-- Check current policies
SELECT policyname FROM pg_policies WHERE tablename = 'i18n_languages';

-- Drop all existing policies on i18n_languages
DROP POLICY IF EXISTS "Anyone can read languages" ON i18n_languages;
DROP POLICY IF EXISTS "Authenticated users can insert languages" ON i18n_languages;
DROP POLICY IF EXISTS "Authenticated users can update languages" ON i18n_languages;
DROP POLICY IF EXISTS "Authenticated users can delete languages" ON i18n_languages;
DROP POLICY IF EXISTS "Languages are readable by everyone" ON i18n_languages;
DROP POLICY IF EXISTS "Languages are writable by authenticated users" ON i18n_languages;

-- Create simple policy that allows all authenticated users to read
CREATE POLICY "Allow authenticated to read languages" 
ON i18n_languages FOR SELECT 
USING (true);  -- Allow everyone to read

-- Create policy for authenticated users to manage languages
CREATE POLICY "Allow authenticated to manage languages" 
ON i18n_languages FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT ALL ON i18n_languages TO authenticated;
GRANT SELECT ON i18n_languages TO anon;

-- Test the fix
SELECT COUNT(*) as language_count FROM i18n_languages;
SELECT code, name FROM i18n_languages ORDER BY code;
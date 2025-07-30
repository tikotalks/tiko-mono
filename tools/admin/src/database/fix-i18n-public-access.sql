-- Fix i18n_languages to allow public read access

-- First, check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'i18n_languages';

-- Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'i18n_languages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON i18n_languages', pol.policyname);
    END LOOP;
END $$;

-- Create a simple policy that allows EVERYONE to read (no auth required)
CREATE POLICY "Public read access" 
ON i18n_languages 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Authenticated write access" 
ON i18n_languages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update access" 
ON i18n_languages 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete access" 
ON i18n_languages 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Grant permissions
GRANT SELECT ON i18n_languages TO anon;
GRANT ALL ON i18n_languages TO authenticated;

-- Test it works
SELECT COUNT(*) as total_languages FROM i18n_languages;
SELECT code, name, is_active FROM i18n_languages ORDER BY code LIMIT 10;
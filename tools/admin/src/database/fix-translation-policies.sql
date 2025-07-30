-- Fix translation policies to allow public read access to approved translations
-- This allows apps to load translations without authentication

-- Drop existing policy
DROP POLICY IF EXISTS "Approved translations are viewable by all authenticated users" ON i18n_translation_versions;

-- Create new policy that allows public read access to approved translations
CREATE POLICY "Approved translations are publicly viewable" 
ON i18n_translation_versions
FOR SELECT 
USING (status = 'approved');

-- Also make the views publicly accessible
GRANT SELECT ON i18n_translations TO anon;
GRANT SELECT ON i18n_locale_details TO anon;

-- Allow public access to read translation keys
GRANT SELECT ON i18n_translation_versions TO anon;
-- Fix permissions for i18n tables to work with Supabase REST API

-- 1. Grant permissions to anon role for public read access
GRANT SELECT ON i18n_languages TO anon;
GRANT SELECT ON i18n_keys TO anon;
GRANT SELECT ON i18n_translations TO anon;

-- 2. Grant permissions to authenticated role
GRANT ALL ON i18n_languages TO authenticated;
GRANT ALL ON i18n_keys TO authenticated;
GRANT ALL ON i18n_translations TO authenticated;

-- 3. Grant usage on sequences (for inserts)
GRANT USAGE ON SEQUENCE i18n_languages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_keys_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_translations_id_seq TO authenticated;

-- 4. Ensure service role has full access
GRANT ALL ON i18n_languages TO service_role;
GRANT ALL ON i18n_keys TO service_role;
GRANT ALL ON i18n_translations TO service_role;

-- 5. Check current grants
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name IN ('i18n_languages', 'i18n_keys', 'i18n_translations')
ORDER BY table_name, grantee, privilege_type;
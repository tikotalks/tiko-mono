-- Test if i18n tables exist and check permissions

-- 1. Check which i18n tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'i18n_%'
ORDER BY table_name;

-- 2. Check if you can read from i18n_keys (even if empty)
SELECT COUNT(*) as key_count FROM i18n_keys;

-- 3. Check if you can read from i18n_languages
SELECT COUNT(*) as language_count FROM i18n_languages;

-- 4. Check if you can read from i18n_translations
SELECT COUNT(*) as translation_count FROM i18n_translations;

-- 5. Check RLS policies on i18n_keys
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'i18n_keys';

-- 6. Test if you can insert a test key (as authenticated user)
-- This will help determine if it's a read or write permission issue
-- INSERT INTO i18n_keys (key, category, description) 
-- VALUES ('test.key', 'test', 'Test key for permissions check')
-- RETURNING *;
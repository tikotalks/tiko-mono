-- Check current user and permissions
SELECT current_user, current_setting('request.jwt.claims', true)::json->>'role' as jwt_role;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'i18n_%';

-- Check policies on i18n_languages
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
WHERE tablename = 'i18n_languages'
ORDER BY policyname;

-- Test direct access
SELECT COUNT(*) as language_count FROM i18n_languages;
SELECT * FROM i18n_languages LIMIT 5;

-- Check if user has the authenticated role
SELECT auth.uid() as user_id, auth.role() as user_role;
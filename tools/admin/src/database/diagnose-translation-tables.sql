-- Diagnostic script to check translation system setup
-- Run this to see what tables/views exist and what's missing

-- Check if tables exist
SELECT 
    'i18n_languages' as object_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'i18n_languages') as exists
UNION ALL
SELECT 
    'i18n_locales' as object_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'i18n_locales') as exists
UNION ALL
SELECT 
    'i18n_translation_versions' as object_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'i18n_translation_versions') as exists
UNION ALL
SELECT 
    'i18n_notifications' as object_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'i18n_notifications') as exists
UNION ALL
SELECT 
    'user_profiles' as object_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') as exists;

-- Check if views exist
SELECT 
    'i18n_translations' as object_name,
    EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'i18n_translations') as exists
UNION ALL
SELECT 
    'i18n_locale_details' as object_name,
    EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'i18n_locale_details') as exists
UNION ALL
SELECT 
    'i18n_pending_translations' as object_name,
    EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'i18n_pending_translations') as exists
UNION ALL
SELECT 
    'i18n_translation_history' as object_name,
    EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'i18n_translation_history') as exists
UNION ALL
SELECT 
    'i18n_contributors' as object_name,
    EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'i18n_contributors') as exists;

-- Check RLS status
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('i18n_languages', 'i18n_locales', 'i18n_translation_versions', 'i18n_notifications', 'user_profiles');

-- Check current user and role
SELECT 
    current_user,
    auth.uid() as auth_uid,
    auth.role() as auth_role,
    auth.email() as auth_email;

-- Check if user has proper role in user_profiles
SELECT 
    user_id,
    role,
    is_active
FROM user_profiles
WHERE user_id = auth.uid();

-- Check permissions on views
SELECT 
    schemaname,
    viewname,
    viewowner,
    has_table_privilege(viewname, 'SELECT') as can_select
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('i18n_locale_details', 'i18n_translations', 'i18n_pending_translations');
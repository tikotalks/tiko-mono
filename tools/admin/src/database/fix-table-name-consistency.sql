-- Fix Table Name Consistency
-- This script ensures all references use the i18n_ prefix consistently

-- If any of the old tables exist, rename them to use i18n_ prefix
DO $$
BEGIN
    -- Rename languages table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'languages') THEN
        ALTER TABLE languages RENAME TO i18n_languages;
        RAISE NOTICE 'Renamed table: languages -> i18n_languages';
    END IF;
    
    -- Rename locales table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locales') THEN
        ALTER TABLE locales RENAME TO i18n_locales;
        RAISE NOTICE 'Renamed table: locales -> i18n_locales';
    END IF;
    
    -- Rename translation_versions table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translation_versions') THEN
        ALTER TABLE translation_versions RENAME TO i18n_translation_versions;
        RAISE NOTICE 'Renamed table: translation_versions -> i18n_translation_versions';
    END IF;
    
    -- Rename translation_notifications table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translation_notifications') THEN
        ALTER TABLE translation_notifications RENAME TO i18n_notifications;
        RAISE NOTICE 'Renamed table: translation_notifications -> i18n_notifications';
    END IF;
    
    -- Rename translation_keys table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translation_keys') THEN
        ALTER TABLE translation_keys RENAME TO i18n_keys;
        RAISE NOTICE 'Renamed table: translation_keys -> i18n_keys';
    END IF;
    
    -- Rename translations table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'translations') THEN
        ALTER TABLE translations RENAME TO i18n_translations_old;
        RAISE NOTICE 'Renamed table: translations -> i18n_translations_old (to avoid conflict with view)';
    END IF;
END $$;

-- Update any views that might reference old table names
-- Drop and recreate views if they exist with old references

-- Drop old views if they exist
DROP VIEW IF EXISTS translations CASCADE;
DROP VIEW IF EXISTS pending_translations CASCADE;
DROP VIEW IF EXISTS translation_history CASCADE;
DROP VIEW IF EXISTS contributors CASCADE;
DROP VIEW IF EXISTS locale_details CASCADE;

-- Recreate views with correct table references (if needed)
-- The complete-translation-system.sql will handle creating the correct views

-- Verify all tables have the i18n_ prefix
DO $$
DECLARE
    table_record RECORD;
    has_issues BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for tables without i18n_ prefix...';
    RAISE NOTICE '';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('languages', 'locales', 'translation_versions', 'translation_notifications', 'translation_keys', 'translations')
    LOOP
        RAISE NOTICE 'WARNING: Table % exists without i18n_ prefix!', table_record.table_name;
        has_issues := TRUE;
    END LOOP;
    
    IF NOT has_issues THEN
        RAISE NOTICE 'All translation tables use the i18n_ prefix correctly.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Current i18n tables:';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name LIKE 'i18n_%'
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  ✓ %', table_record.table_name;
    END LOOP;
END $$;
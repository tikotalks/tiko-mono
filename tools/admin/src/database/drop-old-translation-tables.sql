-- Drop Old Translation Tables (without i18n_ prefix)
-- This script removes the old translation tables that don't use the i18n_ prefix
-- Run this after ensuring all data has been migrated to the new i18n_ prefixed tables

-- Drop old tables if they exist
DROP TABLE IF EXISTS translation_notifications CASCADE;
DROP TABLE IF EXISTS translation_keys CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- Also drop related tables that might exist
DROP TABLE IF EXISTS locales CASCADE;
DROP TABLE IF EXISTS translation_versions CASCADE;

-- Notify about the dropped tables
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Old Translation Tables Dropped';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The following tables have been dropped:';
    RAISE NOTICE '  ✓ languages';
    RAISE NOTICE '  ✓ translations';
    RAISE NOTICE '  ✓ translation_notifications';
    RAISE NOTICE '  ✓ translation_keys';
    RAISE NOTICE '  ✓ locales (if existed)';
    RAISE NOTICE '  ✓ translation_versions (if existed)';
    RAISE NOTICE '';
    RAISE NOTICE 'Make sure you are using the new i18n_ prefixed tables:';
    RAISE NOTICE '  - i18n_languages';
    RAISE NOTICE '  - i18n_translations';
    RAISE NOTICE '  - i18n_notifications';
    RAISE NOTICE '  - i18n_keys';
    RAISE NOTICE '  - i18n_locales';
    RAISE NOTICE '  - i18n_translation_versions';
    RAISE NOTICE '========================================';
END $$;
-- Diagnose and Fix i18n_languages Table Issues
-- Run this script to check if the table exists and has data

-- ============================================
-- 1. CHECK IF THE TABLE EXISTS
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'i18n_languages'
    ) THEN
        RAISE NOTICE 'Table i18n_languages EXISTS ✓';
    ELSE
        RAISE NOTICE 'Table i18n_languages DOES NOT EXIST ✗';
        RAISE NOTICE 'Run create-i18n-tables.sql to create it';
    END IF;
END $$;

-- ============================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'i18n_languages'
ORDER BY ordinal_position;

-- ============================================
-- 3. CHECK ROW COUNT
-- ============================================
SELECT COUNT(*) as total_languages FROM i18n_languages;

-- ============================================
-- 4. CHECK SAMPLE DATA
-- ============================================
SELECT * FROM i18n_languages ORDER BY code LIMIT 10;

-- ============================================
-- 5. CHECK RLS POLICIES
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'i18n_languages';

-- ============================================
-- 6. CHECK PERMISSIONS
-- ============================================
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'i18n_languages'
ORDER BY grantee, privilege_type;

-- ============================================
-- 7. IF TABLE IS EMPTY, INSERT DEFAULT DATA
-- ============================================
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM i18n_languages) = 0 THEN
        RAISE NOTICE 'Table is empty. Inserting default languages...';
        
        INSERT INTO i18n_languages (code, name, native_name, is_active) VALUES
        -- Major European Languages
        ('en', 'English', 'English', true),
        ('en-GB', 'English (UK)', 'English (UK)', true),
        ('en-US', 'English (US)', 'English (US)', true),
        ('nl', 'Dutch', 'Nederlands', true),
        ('nl-NL', 'Dutch (Netherlands)', 'Nederlands (Nederland)', true),
        ('nl-BE', 'Dutch (Belgium)', 'Nederlands (België)', true),
        ('de', 'German', 'Deutsch', true),
        ('de-DE', 'German (Germany)', 'Deutsch (Deutschland)', true),
        ('de-AT', 'German (Austria)', 'Deutsch (Österreich)', true),
        ('de-CH', 'German (Switzerland)', 'Deutsch (Schweiz)', true),
        ('fr', 'French', 'Français', true),
        ('fr-FR', 'French (France)', 'Français (France)', true),
        ('fr-BE', 'French (Belgium)', 'Français (Belgique)', true),
        ('fr-CA', 'French (Canada)', 'Français (Canada)', true),
        ('es', 'Spanish', 'Español', true),
        ('es-ES', 'Spanish (Spain)', 'Español (España)', true),
        ('es-MX', 'Spanish (Mexico)', 'Español (México)', true),
        ('es-AR', 'Spanish (Argentina)', 'Español (Argentina)', true),
        ('it', 'Italian', 'Italiano', true),
        ('it-IT', 'Italian (Italy)', 'Italiano (Italia)', true),
        ('pt', 'Portuguese', 'Português', true),
        ('pt-PT', 'Portuguese (Portugal)', 'Português (Portugal)', true),
        ('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)', true),
        -- Nordic Languages
        ('sv', 'Swedish', 'Svenska', true),
        ('sv-SE', 'Swedish (Sweden)', 'Svenska (Sverige)', true),
        ('no', 'Norwegian', 'Norsk', true),
        ('no-NO', 'Norwegian (Norway)', 'Norsk (Norge)', true),
        ('da', 'Danish', 'Dansk', true),
        ('da-DK', 'Danish (Denmark)', 'Dansk (Danmark)', true),
        ('fi', 'Finnish', 'Suomi', true),
        ('fi-FI', 'Finnish (Finland)', 'Suomi (Suomi)', true),
        ('is', 'Icelandic', 'Íslenska', true),
        ('is-IS', 'Icelandic (Iceland)', 'Íslenska (Ísland)', true),
        -- Eastern European Languages
        ('pl', 'Polish', 'Polski', true),
        ('pl-PL', 'Polish (Poland)', 'Polski (Polska)', true),
        ('ru', 'Russian', 'Русский', true),
        ('ru-RU', 'Russian (Russia)', 'Русский (Россия)', true),
        ('cs', 'Czech', 'Čeština', true),
        ('cs-CZ', 'Czech (Czech Republic)', 'Čeština (Česká republika)', true),
        ('sk', 'Slovak', 'Slovenčina', true),
        ('sk-SK', 'Slovak (Slovakia)', 'Slovenčina (Slovensko)', true),
        ('hu', 'Hungarian', 'Magyar', true),
        ('hu-HU', 'Hungarian (Hungary)', 'Magyar (Magyarország)', true),
        ('ro', 'Romanian', 'Română', true),
        ('ro-RO', 'Romanian (Romania)', 'Română (România)', true),
        ('bg', 'Bulgarian', 'Български', true),
        ('bg-BG', 'Bulgarian (Bulgaria)', 'Български (България)', true),
        ('hr', 'Croatian', 'Hrvatski', true),
        ('hr-HR', 'Croatian (Croatia)', 'Hrvatski (Hrvatska)', true),
        ('sl', 'Slovenian', 'Slovenščina', true),
        ('sl-SI', 'Slovenian (Slovenia)', 'Slovenščina (Slovenija)', true),
        -- Baltic Languages
        ('et', 'Estonian', 'Eesti', true),
        ('et-EE', 'Estonian (Estonia)', 'Eesti (Eesti)', true),
        ('lv', 'Latvian', 'Latviešu', true),
        ('lv-LV', 'Latvian (Latvia)', 'Latviešu (Latvija)', true),
        ('lt', 'Lithuanian', 'Lietuvių', true),
        ('lt-LT', 'Lithuanian (Lithuania)', 'Lietuvių (Lietuva)', true),
        -- Other European Languages
        ('el', 'Greek', 'Ελληνικά', true),
        ('el-GR', 'Greek (Greece)', 'Ελληνικά (Ελλάδα)', true),
        ('ga', 'Irish', 'Gaeilge', true),
        ('ga-IE', 'Irish (Ireland)', 'Gaeilge (Éire)', true),
        ('cy', 'Welsh', 'Cymraeg', true),
        ('cy-GB', 'Welsh (Wales)', 'Cymraeg (Cymru)', true),
        ('mt', 'Maltese', 'Malti', true),
        ('mt-MT', 'Maltese (Malta)', 'Malti (Malta)', true),
        ('hy', 'Armenian', 'Հայերեն', true),
        ('hy-AM', 'Armenian (Armenia)', 'Հայերեն (Հայաստան)', true)
        ON CONFLICT (code) DO NOTHING;
        
        RAISE NOTICE 'Default languages inserted successfully!';
    ELSE
        RAISE NOTICE 'Table already contains data';
    END IF;
END $$;

-- ============================================
-- 8. CREATE i18n_locale_details VIEW IF MISSING
-- ============================================
CREATE OR REPLACE VIEW i18n_locale_details AS
SELECT 
    l.code,
    l.name,
    l.native_name,
    COALESCE(trans_count.count, 0) as translation_count,
    COALESCE(pending_count.count, 0) as pending_count,
    (SELECT COUNT(*) FROM i18n_keys) as total_keys,
    CASE 
        WHEN (SELECT COUNT(*) FROM i18n_keys) > 0 
        THEN ROUND((COALESCE(trans_count.count, 0)::numeric / (SELECT COUNT(*) FROM i18n_keys)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM i18n_languages l
LEFT JOIN (
    SELECT language_code, COUNT(DISTINCT key_id) as count
    FROM i18n_translations
    WHERE is_published = true
    GROUP BY language_code
) trans_count ON l.code = trans_count.language_code
LEFT JOIN (
    SELECT language_code, COUNT(DISTINCT key_id) as count
    FROM i18n_translations
    WHERE is_published = false
    GROUP BY language_code
) pending_count ON l.code = pending_count.language_code
WHERE l.is_active = true
ORDER BY l.name;

-- Grant permissions on the view
GRANT SELECT ON i18n_locale_details TO anon, authenticated;

-- ============================================
-- 9. FINAL STATUS CHECK
-- ============================================
DO $$
DECLARE
    lang_count INTEGER;
    key_count INTEGER;
    trans_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lang_count FROM i18n_languages WHERE is_active = true;
    SELECT COUNT(*) INTO key_count FROM i18n_keys;
    SELECT COUNT(*) INTO trans_count FROM i18n_translations;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'i18n System Status:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Active Languages: %', lang_count;
    RAISE NOTICE 'Translation Keys: %', key_count;
    RAISE NOTICE 'Translations: %', trans_count;
    RAISE NOTICE '========================================';
END $$;
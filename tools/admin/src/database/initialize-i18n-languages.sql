-- Initialize i18n_languages table with default languages
-- Run this script to populate the languages table

-- First, check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'i18n_languages'
    ) THEN
        RAISE EXCEPTION 'Table i18n_languages does not exist. Please run create-i18n-tables.sql first.';
    END IF;
END $$;

-- Insert default languages (will skip if they already exist)
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

-- Show the results
DO $$
DECLARE
    lang_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lang_count FROM i18n_languages WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Languages Initialized Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total active languages: %', lang_count;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Visit the Languages page in the admin UI';
    RAISE NOTICE '2. Start adding translation keys';
    RAISE NOTICE '3. Import translations from JSON files';
    RAISE NOTICE '========================================';
END $$;

-- Show a sample of the languages
SELECT code, name, native_name, is_active 
FROM i18n_languages 
ORDER BY code 
LIMIT 10;
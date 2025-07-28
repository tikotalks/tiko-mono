-- Create languages/locales management tables
CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY, -- ISO 639-1 code (e.g., 'en', 'fr')
    name TEXT NOT NULL, -- English name (e.g., 'English', 'French')
    native_name TEXT NOT NULL, -- Native name (e.g., 'English', 'Français')
    rtl BOOLEAN DEFAULT FALSE, -- Right-to-left language
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS locales (
    code TEXT PRIMARY KEY, -- BCP 47 code (e.g., 'en-US', 'fr-CA')
    language_code TEXT NOT NULL REFERENCES languages(code),
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (e.g., 'US', 'CA')
    name TEXT NOT NULL, -- English name (e.g., 'English (United States)')
    native_name TEXT NOT NULL, -- Native name
    flag_emoji TEXT, -- Country flag emoji
    enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default locale for the language
    fallback_locale TEXT REFERENCES locales(code), -- Explicit fallback
    number_format JSONB, -- Number formatting rules
    date_format JSONB, -- Date formatting rules
    currency_code TEXT, -- Default currency for locale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add locale reference to translations table
ALTER TABLE translations 
    ADD COLUMN IF NOT EXISTS locale_id TEXT REFERENCES locales(code);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_locales_language ON locales(language_code);
CREATE INDEX IF NOT EXISTS idx_locales_enabled ON locales(enabled);
CREATE INDEX IF NOT EXISTS idx_translations_locale_id ON translations(locale_id);

-- Enable Row Level Security
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;

-- Policies for languages table
CREATE POLICY "Languages are viewable by all" ON languages
    FOR SELECT USING (true);

CREATE POLICY "Languages are editable by admin users" ON languages
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role = 'admin'
        )
    );

-- Policies for locales table
CREATE POLICY "Locales are viewable by all" ON locales
    FOR SELECT USING (true);

CREATE POLICY "Locales are editable by admin users" ON locales
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role = 'admin'
        )
    );

-- Function to get locale hierarchy (with all fallbacks)
CREATE OR REPLACE FUNCTION get_locale_hierarchy(p_locale TEXT)
RETURNS TABLE(locale TEXT, level INT) AS $$
WITH RECURSIVE locale_chain AS (
    -- Start with the requested locale
    SELECT code, fallback_locale, 0 as level
    FROM locales
    WHERE code = p_locale
    
    UNION ALL
    
    -- Follow fallback chain
    SELECT l.code, l.fallback_locale, lc.level + 1
    FROM locales l
    JOIN locale_chain lc ON l.code = lc.fallback_locale
    WHERE lc.fallback_locale IS NOT NULL
)
SELECT code as locale, level
FROM locale_chain
ORDER BY level;
$$ LANGUAGE sql;

-- Function to get effective translation with locale hierarchy
CREATE OR REPLACE FUNCTION get_translation_with_fallback(p_key TEXT, p_locale TEXT)
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
    v_locale_record RECORD;
BEGIN
    -- Try each locale in the hierarchy
    FOR v_locale_record IN 
        SELECT locale FROM get_locale_hierarchy(p_locale)
    LOOP
        SELECT value INTO v_value
        FROM translations
        WHERE key = p_key AND locale = v_locale_record.locale;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END LOOP;
    
    -- No translation found
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Insert base languages
INSERT INTO languages (code, name, native_name, rtl) VALUES
    ('en', 'English', 'English', false),
    ('fr', 'French', 'Français', false),
    ('de', 'German', 'Deutsch', false),
    ('es', 'Spanish', 'Español', false),
    ('it', 'Italian', 'Italiano', false),
    ('pt', 'Portuguese', 'Português', false),
    ('nl', 'Dutch', 'Nederlands', false),
    ('pl', 'Polish', 'Polski', false),
    ('ru', 'Russian', 'Русский', false),
    ('sv', 'Swedish', 'Svenska', false),
    ('no', 'Norwegian', 'Norsk', false),
    ('da', 'Danish', 'Dansk', false),
    ('fi', 'Finnish', 'Suomi', false),
    ('is', 'Icelandic', 'Íslenska', false),
    ('el', 'Greek', 'Ελληνικά', false),
    ('ro', 'Romanian', 'Română', false),
    ('bg', 'Bulgarian', 'Български', false),
    ('cs', 'Czech', 'Čeština', false),
    ('sk', 'Slovak', 'Slovenčina', false),
    ('sl', 'Slovene', 'Slovenščina', false),
    ('hr', 'Croatian', 'Hrvatski', false),
    ('hu', 'Hungarian', 'Magyar', false),
    ('et', 'Estonian', 'Eesti', false),
    ('lv', 'Latvian', 'Latviešu', false),
    ('lt', 'Lithuanian', 'Lietuvių', false),
    ('mt', 'Maltese', 'Malti', false),
    ('ga', 'Irish', 'Gaeilge', false),
    ('cy', 'Welsh', 'Cymraeg', false),
    ('hy', 'Armenian', 'Հայերեն', false),
    ('ar', 'Arabic', 'العربية', true),
    ('he', 'Hebrew', 'עברית', true)
ON CONFLICT (code) DO NOTHING;

-- Insert locales with proper fallback chains
INSERT INTO locales (code, language_code, country_code, name, native_name, flag_emoji, is_default, fallback_locale, currency_code) VALUES
    -- English variants
    ('en', 'en', 'US', 'English', 'English', '🌐', true, NULL, 'USD'),
    ('en-US', 'en', 'US', 'English (United States)', 'English (United States)', '🇺🇸', false, 'en', 'USD'),
    ('en-GB', 'en', 'GB', 'English (United Kingdom)', 'English (United Kingdom)', '🇬🇧', false, 'en', 'GBP'),
    ('en-CA', 'en', 'CA', 'English (Canada)', 'English (Canada)', '🇨🇦', false, 'en', 'CAD'),
    ('en-AU', 'en', 'AU', 'English (Australia)', 'English (Australia)', '🇦🇺', false, 'en', 'AUD'),
    
    -- French variants
    ('fr', 'fr', 'FR', 'French', 'Français', '🇫🇷', true, NULL, 'EUR'),
    ('fr-FR', 'fr', 'FR', 'French (France)', 'Français (France)', '🇫🇷', false, 'fr', 'EUR'),
    ('fr-CA', 'fr', 'CA', 'French (Canada)', 'Français (Canada)', '🇨🇦', false, 'fr', 'CAD'),
    ('fr-BE', 'fr', 'BE', 'French (Belgium)', 'Français (Belgique)', '🇧🇪', false, 'fr', 'EUR'),
    
    -- German variants
    ('de', 'de', 'DE', 'German', 'Deutsch', '🇩🇪', true, NULL, 'EUR'),
    ('de-DE', 'de', 'DE', 'German (Germany)', 'Deutsch (Deutschland)', '🇩🇪', false, 'de', 'EUR'),
    ('de-AT', 'de', 'AT', 'German (Austria)', 'Deutsch (Österreich)', '🇦🇹', false, 'de', 'EUR'),
    ('de-CH', 'de', 'CH', 'German (Switzerland)', 'Deutsch (Schweiz)', '🇨🇭', false, 'de', 'CHF'),
    
    -- Spanish variants
    ('es', 'es', 'ES', 'Spanish', 'Español', '🇪🇸', true, NULL, 'EUR'),
    ('es-ES', 'es', 'ES', 'Spanish (Spain)', 'Español (España)', '🇪🇸', false, 'es', 'EUR'),
    ('es-MX', 'es', 'MX', 'Spanish (Mexico)', 'Español (México)', '🇲🇽', false, 'es', 'MXN'),
    ('es-AR', 'es', 'AR', 'Spanish (Argentina)', 'Español (Argentina)', '🇦🇷', false, 'es', 'ARS'),
    
    -- Portuguese variants
    ('pt', 'pt', 'PT', 'Portuguese', 'Português', '🇵🇹', true, NULL, 'EUR'),
    ('pt-PT', 'pt', 'PT', 'Portuguese (Portugal)', 'Português (Portugal)', '🇵🇹', false, 'pt', 'EUR'),
    ('pt-BR', 'pt', 'BR', 'Portuguese (Brazil)', 'Português (Brasil)', '🇧🇷', false, 'pt', 'BRL'),
    
    -- Dutch variants
    ('nl', 'nl', 'NL', 'Dutch', 'Nederlands', '🇳🇱', true, NULL, 'EUR'),
    ('nl-NL', 'nl', 'NL', 'Dutch (Netherlands)', 'Nederlands (Nederland)', '🇳🇱', false, 'nl', 'EUR'),
    ('nl-BE', 'nl', 'BE', 'Dutch (Belgium)', 'Nederlands (België)', '🇧🇪', false, 'nl', 'EUR'),
    
    -- Italian
    ('it', 'it', 'IT', 'Italian', 'Italiano', '🇮🇹', true, NULL, 'EUR'),
    ('it-IT', 'it', 'IT', 'Italian (Italy)', 'Italiano (Italia)', '🇮🇹', false, 'it', 'EUR'),
    
    -- Other European languages
    ('pl', 'pl', 'PL', 'Polish', 'Polski', '🇵🇱', true, NULL, 'PLN'),
    ('pl-PL', 'pl', 'PL', 'Polish (Poland)', 'Polski (Polska)', '🇵🇱', false, 'pl', 'PLN'),
    
    ('ru', 'ru', 'RU', 'Russian', 'Русский', '🇷🇺', true, NULL, 'RUB'),
    ('ru-RU', 'ru', 'RU', 'Russian (Russia)', 'Русский (Россия)', '🇷🇺', false, 'ru', 'RUB'),
    
    ('sv', 'sv', 'SE', 'Swedish', 'Svenska', '🇸🇪', true, NULL, 'SEK'),
    ('sv-SE', 'sv', 'SE', 'Swedish (Sweden)', 'Svenska (Sverige)', '🇸🇪', false, 'sv', 'SEK'),
    
    ('no', 'no', 'NO', 'Norwegian', 'Norsk', '🇳🇴', true, NULL, 'NOK'),
    ('no-NO', 'no', 'NO', 'Norwegian (Norway)', 'Norsk (Norge)', '🇳🇴', false, 'no', 'NOK'),
    
    ('da', 'da', 'DK', 'Danish', 'Dansk', '🇩🇰', true, NULL, 'DKK'),
    ('da-DK', 'da', 'DK', 'Danish (Denmark)', 'Dansk (Danmark)', '🇩🇰', false, 'da', 'DKK'),
    
    ('fi', 'fi', 'FI', 'Finnish', 'Suomi', '🇫🇮', true, NULL, 'EUR'),
    ('fi-FI', 'fi', 'FI', 'Finnish (Finland)', 'Suomi (Suomi)', '🇫🇮', false, 'fi', 'EUR'),
    
    ('is', 'is', 'IS', 'Icelandic', 'Íslenska', '🇮🇸', true, NULL, 'ISK'),
    ('is-IS', 'is', 'IS', 'Icelandic (Iceland)', 'Íslenska (Ísland)', '🇮🇸', false, 'is', 'ISK'),
    
    ('el', 'el', 'GR', 'Greek', 'Ελληνικά', '🇬🇷', true, NULL, 'EUR'),
    ('el-GR', 'el', 'GR', 'Greek (Greece)', 'Ελληνικά (Ελλάδα)', '🇬🇷', false, 'el', 'EUR'),
    
    ('ro', 'ro', 'RO', 'Romanian', 'Română', '🇷🇴', true, NULL, 'RON'),
    ('ro-RO', 'ro', 'RO', 'Romanian (Romania)', 'Română (România)', '🇷🇴', false, 'ro', 'RON'),
    
    ('bg', 'bg', 'BG', 'Bulgarian', 'Български', '🇧🇬', true, NULL, 'BGN'),
    ('bg-BG', 'bg', 'BG', 'Bulgarian (Bulgaria)', 'Български (България)', '🇧🇬', false, 'bg', 'BGN'),
    
    ('cs', 'cs', 'CZ', 'Czech', 'Čeština', '🇨🇿', true, NULL, 'CZK'),
    ('cs-CZ', 'cs', 'CZ', 'Czech (Czech Republic)', 'Čeština (Česká republika)', '🇨🇿', false, 'cs', 'CZK'),
    
    ('sk', 'sk', 'SK', 'Slovak', 'Slovenčina', '🇸🇰', true, NULL, 'EUR'),
    ('sk-SK', 'sk', 'SK', 'Slovak (Slovakia)', 'Slovenčina (Slovensko)', '🇸🇰', false, 'sk', 'EUR'),
    
    ('sl', 'sl', 'SI', 'Slovene', 'Slovenščina', '🇸🇮', true, NULL, 'EUR'),
    ('sl-SI', 'sl', 'SI', 'Slovene (Slovenia)', 'Slovenščina (Slovenija)', '🇸🇮', false, 'sl', 'EUR'),
    
    ('hr', 'hr', 'HR', 'Croatian', 'Hrvatski', '🇭🇷', true, NULL, 'EUR'),
    ('hr-HR', 'hr', 'HR', 'Croatian (Croatia)', 'Hrvatski (Hrvatska)', '🇭🇷', false, 'hr', 'EUR'),
    
    ('hu', 'hu', 'HU', 'Hungarian', 'Magyar', '🇭🇺', true, NULL, 'HUF'),
    ('hu-HU', 'hu', 'HU', 'Hungarian (Hungary)', 'Magyar (Magyarország)', '🇭🇺', false, 'hu', 'HUF'),
    
    ('et', 'et', 'EE', 'Estonian', 'Eesti', '🇪🇪', true, NULL, 'EUR'),
    ('et-EE', 'et', 'EE', 'Estonian (Estonia)', 'Eesti (Eesti)', '🇪🇪', false, 'et', 'EUR'),
    
    ('lv', 'lv', 'LV', 'Latvian', 'Latviešu', '🇱🇻', true, NULL, 'EUR'),
    ('lv-LV', 'lv', 'LV', 'Latvian (Latvia)', 'Latviešu (Latvija)', '🇱🇻', false, 'lv', 'EUR'),
    
    ('lt', 'lt', 'LT', 'Lithuanian', 'Lietuvių', '🇱🇹', true, NULL, 'EUR'),
    ('lt-LT', 'lt', 'LT', 'Lithuanian (Lithuania)', 'Lietuvių (Lietuva)', '🇱🇹', false, 'lt', 'EUR'),
    
    ('mt', 'mt', 'MT', 'Maltese', 'Malti', '🇲🇹', true, NULL, 'EUR'),
    ('mt-MT', 'mt', 'MT', 'Maltese (Malta)', 'Malti (Malta)', '🇲🇹', false, 'mt', 'EUR'),
    
    ('ga', 'ga', 'IE', 'Irish', 'Gaeilge', '🇮🇪', true, NULL, 'EUR'),
    ('ga-IE', 'ga', 'IE', 'Irish (Ireland)', 'Gaeilge (Éire)', '🇮🇪', false, 'ga', 'EUR'),
    
    ('cy', 'cy', 'GB', 'Welsh', 'Cymraeg', '🏴󐁧󐁢󐁷󐁬󐁳󐁿', true, NULL, 'GBP'),
    ('cy-GB', 'cy', 'GB', 'Welsh (United Kingdom)', 'Cymraeg (Y Deyrnas Unedig)', '🏴󐁧󐁢󐁷󐁬󐁳󐁿', false, 'cy', 'GBP'),
    
    ('hy', 'hy', 'AM', 'Armenian', 'Հայերեն', '🇦🇲', true, NULL, 'AMD'),
    ('hy-AM', 'hy', 'AM', 'Armenian (Armenia)', 'Հայերեն (Հայաստան)', '🇦🇲', false, 'hy', 'AMD')
ON CONFLICT (code) DO NOTHING;

-- Update translations table to use new locale reference
UPDATE translations t
SET locale_id = t.locale
WHERE EXISTS (SELECT 1 FROM locales l WHERE l.code = t.locale);

-- View to get locale details with language info
CREATE OR REPLACE VIEW locale_details AS
SELECT 
    l.code,
    l.name,
    l.native_name,
    l.flag_emoji,
    l.enabled,
    l.is_default,
    l.currency_code,
    lg.name as language_name,
    lg.native_name as language_native_name,
    lg.rtl,
    l.fallback_locale,
    (SELECT COUNT(*) FROM translations t WHERE t.locale = l.code) as translation_count,
    (SELECT COUNT(DISTINCT key) FROM translations) as total_keys
FROM locales l
JOIN languages lg ON l.language_code = lg.code
ORDER BY lg.name, l.name;
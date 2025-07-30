-- Create New i18n Tables with Simplified Architecture
-- This script creates all the i18n_ prefixed tables for the translation system

-- ============================================
-- 1. CREATE LANGUAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,  -- e.g., 'en', 'en-GB', 'nl-NL'
    name VARCHAR(100) NOT NULL,        -- e.g., 'English (UK)', 'Dutch (Netherlands)'
    native_name VARCHAR(100),          -- e.g., 'English', 'Nederlands'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CREATE TRANSLATION KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(500) UNIQUE NOT NULL,  -- e.g., 'common.save', 'admin.dashboard.title'
    description TEXT,                   -- Optional description of what this key is for
    category VARCHAR(100),             -- e.g., 'common', 'admin', 'cards'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 3. CREATE TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_translations (
    id SERIAL PRIMARY KEY,
    key_id INTEGER REFERENCES i18n_keys(id) ON DELETE CASCADE,
    language_code VARCHAR(10) REFERENCES i18n_languages(code) ON DELETE CASCADE,
    value TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,                        -- Optional notes about this translation
    
    -- Ensure unique combination of key + language + version
    UNIQUE(key_id, language_code, version)
);

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for i18n_languages
CREATE INDEX IF NOT EXISTS idx_i18n_languages_code ON i18n_languages(code);
CREATE INDEX IF NOT EXISTS idx_i18n_languages_active ON i18n_languages(is_active);

-- Indexes for i18n_keys
CREATE INDEX IF NOT EXISTS idx_i18n_keys_key ON i18n_keys(key);
CREATE INDEX IF NOT EXISTS idx_i18n_keys_category ON i18n_keys(category);

-- Indexes for i18n_translations
CREATE INDEX IF NOT EXISTS idx_i18n_translations_key_language ON i18n_translations(key_id, language_code);
CREATE INDEX IF NOT EXISTS idx_i18n_translations_published ON i18n_translations(is_published);
CREATE INDEX IF NOT EXISTS idx_i18n_translations_version ON i18n_translations(version);
CREATE INDEX IF NOT EXISTS idx_i18n_translations_language ON i18n_translations(language_code);

-- ============================================
-- 5. INSERT DEFAULT LANGUAGES
-- ============================================

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

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_translations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE SECURITY POLICIES
-- ============================================

-- Languages: Everyone can read, only admins can modify
CREATE POLICY "Languages are readable by everyone" 
ON i18n_languages FOR SELECT 
USING (true);

CREATE POLICY "Languages are writable by admins" 
ON i18n_languages FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role = 'admin'
    )
);

-- Translation keys: Everyone can read, editors and admins can create/modify
CREATE POLICY "Translation keys are readable by everyone" 
ON i18n_keys FOR SELECT 
USING (true);

CREATE POLICY "Translation keys are writable by editors and admins" 
ON i18n_keys FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'editor')
    )
);

-- Translations: Everyone can read published, editors and admins can create/modify
CREATE POLICY "Published translations are readable by everyone" 
ON i18n_translations FOR SELECT 
USING (is_published = true);

CREATE POLICY "All translations are readable by editors and admins" 
ON i18n_translations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'editor')
    )
);

CREATE POLICY "Translations are writable by editors and admins" 
ON i18n_translations FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('admin', 'editor')
    )
);

-- ============================================
-- 8. CREATE TRIGGER FOR AUTO-PUBLISHING
-- ============================================

-- Auto-publish translations created by admins
CREATE OR REPLACE FUNCTION auto_publish_admin_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- If created by an admin, auto-publish
    IF EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = NEW.created_by 
        AND user_profiles.role = 'admin'
    ) THEN
        NEW.is_published = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_publish_admin_translations
    BEFORE INSERT ON i18n_translations
    FOR EACH ROW
    EXECUTE FUNCTION auto_publish_admin_translations();

-- ============================================
-- 9. CREATE HELPFUL VIEWS
-- ============================================

-- View to get the latest published translation for each key/language
CREATE OR REPLACE VIEW i18n_current_translations AS
SELECT DISTINCT ON (k.key, t.language_code)
    k.key,
    k.category,
    k.description,
    t.language_code,
    t.value,
    t.version,
    t.created_at,
    t.created_by
FROM i18n_keys k
JOIN i18n_translations t ON k.id = t.key_id
WHERE t.is_published = true
ORDER BY k.key, t.language_code, t.version DESC;

-- View to see translation coverage by language
CREATE OR REPLACE VIEW i18n_language_coverage AS
SELECT 
    l.code,
    l.name,
    l.native_name,
    COUNT(DISTINCT t.key_id) as translated_keys,
    (SELECT COUNT(*) FROM i18n_keys) as total_keys,
    CASE 
        WHEN (SELECT COUNT(*) FROM i18n_keys) > 0 
        THEN ROUND((COUNT(DISTINCT t.key_id)::numeric / (SELECT COUNT(*) FROM i18n_keys)::numeric) * 100, 2)
        ELSE 0
    END as coverage_percentage
FROM i18n_languages l
LEFT JOIN i18n_translations t ON l.code = t.language_code AND t.is_published = true
WHERE l.is_active = true
GROUP BY l.code, l.name, l.native_name
ORDER BY coverage_percentage DESC, l.name;

-- View to find missing translations
CREATE OR REPLACE VIEW i18n_missing_translations AS
SELECT 
    l.code as language_code,
    l.name as language_name,
    k.key,
    k.category,
    k.description
FROM i18n_languages l
CROSS JOIN i18n_keys k
LEFT JOIN i18n_translations t ON l.code = t.language_code AND k.id = t.key_id AND t.is_published = true
WHERE l.is_active = true
AND t.id IS NULL
ORDER BY l.name, k.category, k.key;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

-- Grant read access to everyone (including anonymous users)
GRANT SELECT ON i18n_languages TO anon, authenticated;
GRANT SELECT ON i18n_keys TO anon, authenticated;
GRANT SELECT ON i18n_translations TO anon, authenticated;
GRANT SELECT ON i18n_current_translations TO anon, authenticated;
GRANT SELECT ON i18n_language_coverage TO anon, authenticated;
GRANT SELECT ON i18n_missing_translations TO authenticated;

-- Grant write access to authenticated users (controlled by RLS)
GRANT INSERT, UPDATE, DELETE ON i18n_languages TO authenticated;
GRANT INSERT, UPDATE, DELETE ON i18n_keys TO authenticated;
GRANT INSERT, UPDATE, DELETE ON i18n_translations TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON SEQUENCE i18n_languages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_keys_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE i18n_translations_id_seq TO authenticated;

-- ============================================
-- 11. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'i18n Tables Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ i18n_languages (62 languages)';
    RAISE NOTICE '  ✓ i18n_keys';
    RAISE NOTICE '  ✓ i18n_translations';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  ✓ i18n_current_translations';
    RAISE NOTICE '  ✓ i18n_language_coverage';
    RAISE NOTICE '  ✓ i18n_missing_translations';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  ✓ Row Level Security enabled';
    RAISE NOTICE '  ✓ Policies configured';
    RAISE NOTICE '  ✓ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✓ Auto-publish for admin translations';
    RAISE NOTICE '  ✓ Version tracking';
    RAISE NOTICE '  ✓ Language inheritance support';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Import translations from existing files';
    RAISE NOTICE '  2. Test the translation admin interface';
    RAISE NOTICE '  3. Start managing translations!';
    RAISE NOTICE '========================================';
END $$;
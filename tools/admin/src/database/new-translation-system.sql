-- New Translation System Migration
-- This will replace the old complex translation system with a simple, clean architecture

-- Drop old tables if they exist
DROP TABLE IF EXISTS i18n_translation_versions CASCADE;
DROP TABLE IF EXISTS i18n_translations CASCADE;
DROP TABLE IF EXISTS i18n_keys CASCADE;
DROP TABLE IF EXISTS i18n_locales CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS translation_keys CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- Languages table
CREATE TABLE i18n_languages (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,  -- e.g., 'en', 'en-GB', 'nl-NL'
    name VARCHAR(100) NOT NULL,        -- e.g., 'English (UK)', 'Dutch (Netherlands)'
    native_name VARCHAR(100),          -- e.g., 'English', 'Nederlands'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Translation keys table
CREATE TABLE i18n_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(500) UNIQUE NOT NULL,  -- e.g., 'common.save', 'admin.dashboard.title'
    description TEXT,                   -- Optional description of what this key is for
    category VARCHAR(100),             -- e.g., 'common', 'admin', 'cards'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Translations table
CREATE TABLE i18n_translations (
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

-- Indexes for performance
CREATE INDEX idx_i18n_translations_key_language ON i18n_translations(key_id, language_code);
CREATE INDEX idx_i18n_translations_published ON i18n_translations(is_published);
CREATE INDEX idx_i18n_translations_version ON i18n_translations(version);
CREATE INDEX idx_i18n_keys_key ON i18n_keys(key);
CREATE INDEX idx_i18n_keys_category ON i18n_keys(category);

-- Insert default languages
INSERT INTO i18n_languages (code, name, native_name, is_active) VALUES
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
('ru', 'Russian', 'Русский', true),
('ru-RU', 'Russian (Russia)', 'Русский (Россия)', true),
('pl', 'Polish', 'Polski', true),
('pl-PL', 'Polish (Poland)', 'Polski (Polska)', true),
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
('et', 'Estonian', 'Eesti', true),
('et-EE', 'Estonian (Estonia)', 'Eesti (Eesti)', true),
('lv', 'Latvian', 'Latviešu', true),
('lv-LV', 'Latvian (Latvia)', 'Latviešu (Latvija)', true),
('lt', 'Lithuanian', 'Lietuvių', true),
('lt-LT', 'Lithuanian (Lithuania)', 'Lietuvių (Lietuva)', true),
('fi', 'Finnish', 'Suomi', true),
('fi-FI', 'Finnish (Finland)', 'Suomi (Suomi)', true),
('sv', 'Swedish', 'Svenska', true),
('sv-SE', 'Swedish (Sweden)', 'Svenska (Sverige)', true),
('da', 'Danish', 'Dansk', true),
('da-DK', 'Danish (Denmark)', 'Dansk (Danmark)', true),
('no', 'Norwegian', 'Norsk', true),
('no-NO', 'Norwegian (Norway)', 'Norsk (Norge)', true),
('is', 'Icelandic', 'Íslenska', true),
('is-IS', 'Icelandic (Iceland)', 'Íslenska (Ísland)', true),
('ga', 'Irish', 'Gaeilge', true),
('ga-IE', 'Irish (Ireland)', 'Gaeilge (Éire)', true),
('cy', 'Welsh', 'Cymraeg', true),
('cy-GB', 'Welsh (Wales)', 'Cymraeg (Cymru)', true),
('mt', 'Maltese', 'Malti', true),
('mt-MT', 'Maltese (Malta)', 'Malti (Malta)', true),
('el', 'Greek', 'Ελληνικά', true),
('el-GR', 'Greek (Greece)', 'Ελληνικά (Ελλάδα)', true),
('hy', 'Armenian', 'Հայերեն', true),
('hy-AM', 'Armenian (Armenia)', 'Հայերեն (Հայաստան)', true);

-- Row Level Security (RLS) policies
ALTER TABLE i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_translations ENABLE ROW LEVEL SECURITY;

-- Languages: Everyone can read, only admins can modify
CREATE POLICY "Languages are readable by everyone" ON i18n_languages FOR SELECT USING (true);
CREATE POLICY "Languages are writable by admins" ON i18n_languages FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role = 'admin')
);

-- Translation keys: Everyone can read, editors and admins can create/modify
CREATE POLICY "Translation keys are readable by everyone" ON i18n_keys FOR SELECT USING (true);
CREATE POLICY "Translation keys are writable by editors and admins" ON i18n_keys FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role IN ('admin', 'editor'))
);

-- Translations: Everyone can read published, editors and admins can create/modify
CREATE POLICY "Published translations are readable by everyone" ON i18n_translations FOR SELECT USING (is_published = true);
CREATE POLICY "All translations are readable by editors and admins" ON i18n_translations FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role IN ('admin', 'editor'))
);
CREATE POLICY "Translations are writable by editors and admins" ON i18n_translations FOR ALL USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role IN ('admin', 'editor'))
);

-- Auto-publish translations created by admins
CREATE OR REPLACE FUNCTION auto_publish_admin_translations()
RETURNS TRIGGER AS $$
BEGIN
    -- If created by an admin, auto-publish
    IF EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = NEW.created_by AND user_profiles.role = 'admin') THEN
        NEW.is_published = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_publish_admin_translations
    BEFORE INSERT ON i18n_translations
    FOR EACH ROW
    EXECUTE FUNCTION auto_publish_admin_translations();
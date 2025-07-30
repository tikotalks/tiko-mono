-- ============================================
-- COMPLETE TRANSLATION SYSTEM WITH VERSIONING
-- Run this entire script on a fresh database
-- ============================================

-- ============================================
-- 1. CREATE LANGUAGES TABLE FIRST
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_languages (
    code TEXT PRIMARY KEY, -- ISO 639-1 code (e.g., 'en', 'fr')
    name TEXT NOT NULL, -- English name (e.g., 'English', 'French')
    native_name TEXT NOT NULL, -- Native name (e.g., 'English', 'Français')
    rtl BOOLEAN DEFAULT FALSE, -- Right-to-left language
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- 2. CREATE LOCALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_locales (
    code TEXT PRIMARY KEY, -- BCP 47 code (e.g., 'en-US', 'fr-CA')
    language_code TEXT NOT NULL REFERENCES i18n_languages(code),
    country_code TEXT NOT NULL, -- ISO 3166-1 alpha-2 (e.g., 'US', 'CA')
    name TEXT NOT NULL, -- English name (e.g., 'English (United States)')
    native_name TEXT NOT NULL, -- Native name
    flag_emoji TEXT, -- Country flag emoji
    enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default locale for the language
    fallback_locale TEXT REFERENCES i18n_locales(code), -- Explicit fallback
    number_format JSONB, -- Number formatting rules
    date_format JSONB, -- Date formatting rules
    currency_code TEXT, -- Default currency for locale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_i18n_locales_language ON i18n_locales(language_code);
CREATE INDEX IF NOT EXISTS idx_i18n_locales_enabled ON i18n_locales(enabled);

-- ============================================
-- 3. CREATE TRANSLATION VERSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_translation_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    locale TEXT NOT NULL REFERENCES i18n_locales(code),
    value TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    auto_translated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Approval metadata
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    
    -- Previous version reference for history tracking
    previous_version_id UUID REFERENCES i18n_translation_versions(id),
    
    -- Ensure unique version numbers per key/locale
    UNIQUE(key, locale, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_i18n_translation_versions_key_locale ON i18n_translation_versions(key, locale);
CREATE INDEX idx_i18n_translation_versions_status ON i18n_translation_versions(status);
CREATE INDEX idx_i18n_translation_versions_created_by ON i18n_translation_versions(created_by);
CREATE INDEX idx_i18n_translation_versions_previous ON i18n_translation_versions(previous_version_id);

-- ============================================
-- 4. CREATE NOTIFICATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    translation_version_id UUID REFERENCES i18n_translation_versions(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_translation', 'approved', 'rejected', 'needs_review')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_i18n_notifications_user ON i18n_notifications(user_id);
CREATE INDEX idx_i18n_notifications_read ON i18n_notifications(read);

-- ============================================
-- 5. INSERT BASE LANGUAGES
-- ============================================

INSERT INTO i18n_languages (code, name, native_name, rtl) VALUES
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

-- ============================================
-- 6. INSERT LOCALES (MUST BE AFTER LANGUAGES)
-- ============================================

-- Insert base locales first (no fallback)
INSERT INTO i18n_locales (code, language_code, country_code, name, native_name, flag_emoji, is_default, fallback_locale, currency_code) VALUES
    ('en', 'en', 'US', 'English', 'English', '🌐', true, NULL, 'USD'),
    ('fr', 'fr', 'FR', 'French', 'Français', '🇫🇷', true, NULL, 'EUR'),
    ('de', 'de', 'DE', 'German', 'Deutsch', '🇩🇪', true, NULL, 'EUR'),
    ('es', 'es', 'ES', 'Spanish', 'Español', '🇪🇸', true, NULL, 'EUR'),
    ('it', 'it', 'IT', 'Italian', 'Italiano', '🇮🇹', true, NULL, 'EUR'),
    ('pt', 'pt', 'PT', 'Portuguese', 'Português', '🇵🇹', true, NULL, 'EUR'),
    ('nl', 'nl', 'NL', 'Dutch', 'Nederlands', '🇳🇱', true, NULL, 'EUR'),
    ('pl', 'pl', 'PL', 'Polish', 'Polski', '🇵🇱', true, NULL, 'PLN'),
    ('ru', 'ru', 'RU', 'Russian', 'Русский', '🇷🇺', true, NULL, 'RUB'),
    ('sv', 'sv', 'SE', 'Swedish', 'Svenska', '🇸🇪', true, NULL, 'SEK'),
    ('no', 'no', 'NO', 'Norwegian', 'Norsk', '🇳🇴', true, NULL, 'NOK'),
    ('da', 'da', 'DK', 'Danish', 'Dansk', '🇩🇰', true, NULL, 'DKK'),
    ('fi', 'fi', 'FI', 'Finnish', 'Suomi', '🇫🇮', true, NULL, 'EUR'),
    ('is', 'is', 'IS', 'Icelandic', 'Íslenska', '🇮🇸', true, NULL, 'ISK'),
    ('el', 'el', 'GR', 'Greek', 'Ελληνικά', '🇬🇷', true, NULL, 'EUR'),
    ('ro', 'ro', 'RO', 'Romanian', 'Română', '🇷🇴', true, NULL, 'RON'),
    ('bg', 'bg', 'BG', 'Bulgarian', 'Български', '🇧🇬', true, NULL, 'BGN'),
    ('cs', 'cs', 'CZ', 'Czech', 'Čeština', '🇨🇿', true, NULL, 'CZK'),
    ('sk', 'sk', 'SK', 'Slovak', 'Slovenčina', '🇸🇰', true, NULL, 'EUR'),
    ('sl', 'sl', 'SI', 'Slovene', 'Slovenščina', '🇸🇮', true, NULL, 'EUR'),
    ('hr', 'hr', 'HR', 'Croatian', 'Hrvatski', '🇭🇷', true, NULL, 'EUR'),
    ('hu', 'hu', 'HU', 'Hungarian', 'Magyar', '🇭🇺', true, NULL, 'HUF'),
    ('et', 'et', 'EE', 'Estonian', 'Eesti', '🇪🇪', true, NULL, 'EUR'),
    ('lv', 'lv', 'LV', 'Latvian', 'Latviešu', '🇱🇻', true, NULL, 'EUR'),
    ('lt', 'lt', 'LT', 'Lithuanian', 'Lietuvių', '🇱🇹', true, NULL, 'EUR'),
    ('mt', 'mt', 'MT', 'Maltese', 'Malti', '🇲🇹', true, NULL, 'EUR'),
    ('ga', 'ga', 'IE', 'Irish', 'Gaeilge', '🇮🇪', true, NULL, 'EUR'),
    ('cy', 'cy', 'GB', 'Welsh', 'Cymraeg', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', true, NULL, 'GBP'),
    ('hy', 'hy', 'AM', 'Armenian', 'Հայերեն', '🇦🇲', true, NULL, 'AMD')
ON CONFLICT (code) DO NOTHING;

-- Now insert locale variants (with fallback)
INSERT INTO i18n_locales (code, language_code, country_code, name, native_name, flag_emoji, is_default, fallback_locale, currency_code) VALUES
    -- English variants
    ('en-US', 'en', 'US', 'English (United States)', 'English (United States)', '🇺🇸', false, 'en', 'USD'),
    ('en-GB', 'en', 'GB', 'English (United Kingdom)', 'English (United Kingdom)', '🇬🇧', false, 'en', 'GBP'),
    ('en-CA', 'en', 'CA', 'English (Canada)', 'English (Canada)', '🇨🇦', false, 'en', 'CAD'),
    ('en-AU', 'en', 'AU', 'English (Australia)', 'English (Australia)', '🇦🇺', false, 'en', 'AUD'),
    
    -- French variants
    ('fr-FR', 'fr', 'FR', 'French (France)', 'Français (France)', '🇫🇷', false, 'fr', 'EUR'),
    ('fr-CA', 'fr', 'CA', 'French (Canada)', 'Français (Canada)', '🇨🇦', false, 'fr', 'CAD'),
    ('fr-BE', 'fr', 'BE', 'French (Belgium)', 'Français (Belgique)', '🇧🇪', false, 'fr', 'EUR'),
    
    -- German variants
    ('de-DE', 'de', 'DE', 'German (Germany)', 'Deutsch (Deutschland)', '🇩🇪', false, 'de', 'EUR'),
    ('de-AT', 'de', 'AT', 'German (Austria)', 'Deutsch (Österreich)', '🇦🇹', false, 'de', 'EUR'),
    ('de-CH', 'de', 'CH', 'German (Switzerland)', 'Deutsch (Schweiz)', '🇨🇭', false, 'de', 'CHF'),
    
    -- Spanish variants
    ('es-ES', 'es', 'ES', 'Spanish (Spain)', 'Español (España)', '🇪🇸', false, 'es', 'EUR'),
    ('es-MX', 'es', 'MX', 'Spanish (Mexico)', 'Español (México)', '🇲🇽', false, 'es', 'MXN'),
    ('es-AR', 'es', 'AR', 'Spanish (Argentina)', 'Español (Argentina)', '🇦🇷', false, 'es', 'ARS'),
    
    -- Portuguese variants
    ('pt-PT', 'pt', 'PT', 'Portuguese (Portugal)', 'Português (Portugal)', '🇵🇹', false, 'pt', 'EUR'),
    ('pt-BR', 'pt', 'BR', 'Portuguese (Brazil)', 'Português (Brasil)', '🇧🇷', false, 'pt', 'BRL'),
    
    -- Dutch variants
    ('nl-NL', 'nl', 'NL', 'Dutch (Netherlands)', 'Nederlands (Nederland)', '🇳🇱', false, 'nl', 'EUR'),
    ('nl-BE', 'nl', 'BE', 'Dutch (Belgium)', 'Nederlands (België)', '🇧🇪', false, 'nl', 'EUR'),
    
    -- Italian
    ('it-IT', 'it', 'IT', 'Italian (Italy)', 'Italiano (Italia)', '🇮🇹', false, 'it', 'EUR'),
    
    -- Other specific locales
    ('pl-PL', 'pl', 'PL', 'Polish (Poland)', 'Polski (Polska)', '🇵🇱', false, 'pl', 'PLN'),
    ('ru-RU', 'ru', 'RU', 'Russian (Russia)', 'Русский (Россия)', '🇷🇺', false, 'ru', 'RUB'),
    ('sv-SE', 'sv', 'SE', 'Swedish (Sweden)', 'Svenska (Sverige)', '🇸🇪', false, 'sv', 'SEK'),
    ('no-NO', 'no', 'NO', 'Norwegian (Norway)', 'Norsk (Norge)', '🇳🇴', false, 'no', 'NOK'),
    ('da-DK', 'da', 'DK', 'Danish (Denmark)', 'Dansk (Danmark)', '🇩🇰', false, 'da', 'DKK'),
    ('fi-FI', 'fi', 'FI', 'Finnish (Finland)', 'Suomi (Suomi)', '🇫🇮', false, 'fi', 'EUR'),
    ('is-IS', 'is', 'IS', 'Icelandic (Iceland)', 'Íslenska (Ísland)', '🇮🇸', false, 'is', 'ISK'),
    ('el-GR', 'el', 'GR', 'Greek (Greece)', 'Ελληνικά (Ελλάδα)', '🇬🇷', false, 'el', 'EUR'),
    ('ro-RO', 'ro', 'RO', 'Romanian (Romania)', 'Română (România)', '🇷🇴', false, 'ro', 'RON'),
    ('bg-BG', 'bg', 'BG', 'Bulgarian (Bulgaria)', 'Български (България)', '🇧🇬', false, 'bg', 'BGN'),
    ('cs-CZ', 'cs', 'CZ', 'Czech (Czech Republic)', 'Čeština (Česká republika)', '🇨🇿', false, 'cs', 'CZK'),
    ('sk-SK', 'sk', 'SK', 'Slovak (Slovakia)', 'Slovenčina (Slovensko)', '🇸🇰', false, 'sk', 'EUR'),
    ('sl-SI', 'sl', 'SI', 'Slovene (Slovenia)', 'Slovenščina (Slovenija)', '🇸🇮', false, 'sl', 'EUR'),
    ('hr-HR', 'hr', 'HR', 'Croatian (Croatia)', 'Hrvatski (Hrvatska)', '🇭🇷', false, 'hr', 'EUR'),
    ('hu-HU', 'hu', 'HU', 'Hungarian (Hungary)', 'Magyar (Magyarország)', '🇭🇺', false, 'hu', 'HUF'),
    ('et-EE', 'et', 'EE', 'Estonian (Estonia)', 'Eesti (Eesti)', '🇪🇪', false, 'et', 'EUR'),
    ('lv-LV', 'lv', 'LV', 'Latvian (Latvia)', 'Latviešu (Latvija)', '🇱🇻', false, 'lv', 'EUR'),
    ('lt-LT', 'lt', 'LT', 'Lithuanian (Lithuania)', 'Lietuvių (Lietuva)', '🇱🇹', false, 'lt', 'EUR'),
    ('mt-MT', 'mt', 'MT', 'Maltese (Malta)', 'Malti (Malta)', '🇲🇹', false, 'mt', 'EUR'),
    ('ga-IE', 'ga', 'IE', 'Irish (Ireland)', 'Gaeilge (Éire)', '🇮🇪', false, 'ga', 'EUR'),
    ('cy-GB', 'cy', 'GB', 'Welsh (United Kingdom)', 'Cymraeg (Y Deyrnas Unedig)', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', false, 'cy', 'GBP'),
    ('hy-AM', 'hy', 'AM', 'Armenian (Armenia)', 'Հայերեն (Հայաստան)', '🇦🇲', false, 'hy', 'AMD')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. CREATE VIEWS FOR CURRENT TRANSLATIONS
-- ============================================

-- This view shows only the latest approved version for each key/locale
CREATE OR REPLACE VIEW i18n_translations AS
WITH latest_approved AS (
    SELECT DISTINCT ON (key, locale)
        id,
        key,
        locale,
        value,
        version_number,
        status,
        auto_translated,
        created_at,
        created_by,
        reviewed_at,
        reviewed_by
    FROM i18n_translation_versions
    WHERE status = 'approved'
    ORDER BY key, locale, version_number DESC
)
SELECT * FROM latest_approved;

-- View for pending translations (awaiting approval)
CREATE OR REPLACE VIEW i18n_pending_translations AS
SELECT 
    tv.*,
    u_creator.email as creator_email,
    u_creator.raw_user_meta_data->>'full_name' as creator_name,
    prev.value as previous_value,
    prev.version_number as previous_version,
    l.name as locale_name,
    l.flag_emoji
FROM i18n_translation_versions tv
LEFT JOIN auth.users u_creator ON tv.created_by = u_creator.id
LEFT JOIN i18n_translation_versions prev ON tv.previous_version_id = prev.id
LEFT JOIN i18n_locales l ON tv.locale = l.code
WHERE tv.status = 'pending'
ORDER BY tv.created_at DESC;

-- ============================================
-- 8. CREATE FUNCTIONS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for timestamp updates
CREATE TRIGGER update_i18n_languages_updated_at BEFORE UPDATE ON i18n_languages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_i18n_locales_updated_at BEFORE UPDATE ON i18n_locales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create a new translation version
CREATE OR REPLACE FUNCTION create_translation_version(
    p_key TEXT,
    p_locale TEXT,
    p_value TEXT,
    p_auto_translated BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_previous_id UUID;
    v_new_id UUID;
    v_user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    -- Get the latest version for this key/locale
    SELECT id, version_number 
    INTO v_previous_id, v_version_number
    FROM i18n_translation_versions
    WHERE key = p_key AND locale = p_locale
    ORDER BY version_number DESC
    LIMIT 1;
    
    -- Increment version number or start at 1
    v_version_number := COALESCE(v_version_number + 1, 1);
    
    -- Insert new version
    INSERT INTO i18n_translation_versions (
        key, 
        locale, 
        value, 
        version_number,
        status,
        auto_translated, 
        created_by,
        previous_version_id
    ) VALUES (
        p_key, 
        p_locale, 
        p_value, 
        v_version_number,
        CASE 
            WHEN v_user_role IN ('admin', 'editor') THEN 'approved'
            ELSE 'pending'
        END,
        p_auto_translated, 
        auth.uid(),
        v_previous_id
    ) RETURNING id INTO v_new_id;
    
    -- If admin/editor, auto-approve
    IF v_user_role IN ('admin', 'editor') THEN
        UPDATE i18n_translation_versions
        SET reviewed_at = NOW(),
            reviewed_by = auth.uid()
        WHERE id = v_new_id;
    END IF;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a translation
CREATE OR REPLACE FUNCTION approve_translation(
    p_version_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Only admins and editors can approve translations';
    END IF;
    
    -- Update the translation status
    UPDATE i18n_translation_versions
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        review_notes = p_notes
    WHERE id = p_version_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a translation
CREATE OR REPLACE FUNCTION reject_translation(
    p_version_id UUID,
    p_notes TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE user_id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Only admins and editors can reject translations';
    END IF;
    
    -- Update the translation status
    UPDATE i18n_translation_versions
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        review_notes = p_notes
    WHERE id = p_version_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get locale hierarchy (with all fallbacks)
CREATE OR REPLACE FUNCTION get_locale_hierarchy(p_locale TEXT)
RETURNS TABLE(locale TEXT, level INT) AS $$
WITH RECURSIVE locale_chain AS (
    -- Start with the requested locale
    SELECT code, fallback_locale, 0 as level
    FROM i18n_locales
    WHERE code = p_locale
    
    UNION ALL
    
    -- Follow fallback chain
    SELECT l.code, l.fallback_locale, lc.level + 1
    FROM i18n_locales l
    JOIN locale_chain lc ON l.code = lc.fallback_locale
    WHERE lc.fallback_locale IS NOT NULL
)
SELECT code as locale, level
FROM locale_chain
ORDER BY level;
$$ LANGUAGE sql;

-- ============================================
-- 9. CREATE STATISTICS VIEWS
-- ============================================

-- Translation history view
CREATE OR REPLACE VIEW i18n_translation_history AS
SELECT 
    tv.id,
    tv.key,
    tv.locale,
    tv.value,
    tv.version_number,
    tv.status,
    tv.auto_translated,
    tv.created_at,
    u_creator.email as created_by_email,
    u_creator.raw_user_meta_data->>'full_name' as created_by_name,
    tv.reviewed_at,
    u_reviewer.email as reviewed_by_email,
    u_reviewer.raw_user_meta_data->>'full_name' as reviewed_by_name,
    tv.review_notes,
    l.name as locale_name,
    l.flag_emoji
FROM i18n_translation_versions tv
LEFT JOIN auth.users u_creator ON tv.created_by = u_creator.id
LEFT JOIN auth.users u_reviewer ON tv.reviewed_by = u_reviewer.id
LEFT JOIN i18n_locales l ON tv.locale = l.code
ORDER BY tv.key, tv.locale, tv.version_number DESC;

-- Contributor statistics view
CREATE OR REPLACE VIEW i18n_contributors AS
SELECT 
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    COUNT(DISTINCT tv.id) as total_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'approved') as approved_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'pending') as pending_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'rejected') as rejected_translations,
    COUNT(DISTINCT tv.locale) as locales_contributed,
    MAX(tv.created_at) as last_contribution
FROM auth.users u
JOIN i18n_translation_versions tv ON tv.created_by = u.id
GROUP BY u.id, u.email, u.raw_user_meta_data->>'full_name'
ORDER BY approved_translations DESC, total_translations DESC;

-- Locale statistics view
CREATE OR REPLACE VIEW i18n_locale_details AS
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
    (SELECT COUNT(DISTINCT key) FROM i18n_translations t WHERE t.locale = l.code) as translation_count,
    (SELECT COUNT(DISTINCT tv.key) FROM i18n_translation_versions tv WHERE tv.locale = l.code AND tv.status = 'pending') as pending_count,
    (SELECT COUNT(DISTINCT key) FROM i18n_translation_versions) as total_keys,
    CASE 
        WHEN (SELECT COUNT(DISTINCT key) FROM i18n_translation_versions) > 0 
        THEN ROUND(((SELECT COUNT(DISTINCT key) FROM i18n_translations t WHERE t.locale = l.code)::numeric / 
              (SELECT COUNT(DISTINCT key) FROM i18n_translation_versions)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM i18n_locales l
JOIN i18n_languages lg ON l.language_code = lg.code
ORDER BY lg.name, l.name;

-- ============================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_translation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_notifications ENABLE ROW LEVEL SECURITY;

-- Languages policies
CREATE POLICY "Languages are viewable by all" ON i18n_languages
    FOR SELECT USING (true);

CREATE POLICY "Languages are editable by admin users" ON i18n_languages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Locales policies
CREATE POLICY "Locales are viewable by all" ON i18n_locales
    FOR SELECT USING (true);

CREATE POLICY "Locales are editable by admin users" ON i18n_locales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Translation versions policies
CREATE POLICY "Approved translations are viewable by all authenticated users" 
ON i18n_translation_versions
FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND status = 'approved'
);

CREATE POLICY "Users can view their own translations" 
ON i18n_translation_versions
FOR SELECT 
USING (
    auth.uid() = created_by
);

CREATE POLICY "Admins can view all translations" 
ON i18n_translation_versions
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
);

CREATE POLICY "Authenticated users can create pending translations" 
ON i18n_translation_versions
FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND status = 'pending'
    AND created_by = auth.uid()
);

CREATE POLICY "Only admins can update translation status" 
ON i18n_translation_versions
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
);

CREATE POLICY "Users can update their own pending translations" 
ON i18n_translation_versions
FOR UPDATE 
USING (
    created_by = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    created_by = auth.uid() 
    AND status = 'pending'
);

-- Notification policies
CREATE POLICY "Users can view their own notifications" 
ON i18n_notifications
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON i18n_notifications
FOR UPDATE 
USING (user_id = auth.uid());

-- ============================================
-- 11. CREATE NOTIFICATION TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION notify_translation_review() RETURNS TRIGGER AS $$
BEGIN
    -- Notify all admins/editors when a new translation needs review
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
        INSERT INTO i18n_notifications (user_id, translation_version_id, type)
        SELECT up.user_id, NEW.id, 'needs_review'
        FROM user_profiles up
        WHERE up.role IN ('admin', 'editor')
        AND up.user_id != NEW.created_by;
    END IF;
    
    -- Notify the creator when their translation is reviewed
    IF OLD IS NOT NULL AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        INSERT INTO i18n_notifications (user_id, translation_version_id, type)
        VALUES (NEW.created_by, NEW.id, NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER i18n_review_notifications
    AFTER INSERT OR UPDATE ON i18n_translation_versions
    FOR EACH ROW EXECUTE FUNCTION notify_translation_review();

-- ============================================
-- 12. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON i18n_languages TO authenticated;
GRANT SELECT ON i18n_locales TO authenticated;
GRANT SELECT ON i18n_translations TO authenticated;
GRANT SELECT ON i18n_pending_translations TO authenticated;
GRANT SELECT ON i18n_translation_history TO authenticated;
GRANT SELECT ON i18n_contributors TO authenticated;
GRANT SELECT ON i18n_locale_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON i18n_translation_versions TO authenticated;
GRANT SELECT, UPDATE ON i18n_notifications TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION create_translation_version TO authenticated;
GRANT EXECUTE ON FUNCTION approve_translation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_translation TO authenticated;
GRANT EXECUTE ON FUNCTION get_locale_hierarchy TO authenticated;

-- Grant additional permissions to service role
GRANT ALL ON i18n_languages TO service_role;
GRANT ALL ON i18n_locales TO service_role;
GRANT ALL ON i18n_translation_versions TO service_role;
GRANT ALL ON i18n_notifications TO service_role;

-- ============================================
-- 13. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Translation System Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  ✓ i18n_languages (31 records)';
    RAISE NOTICE '  ✓ i18n_locales (62 records)';
    RAISE NOTICE '  ✓ i18n_translation_versions';
    RAISE NOTICE '  ✓ i18n_notifications';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  ✓ i18n_translations (approved only)';
    RAISE NOTICE '  ✓ i18n_pending_translations';
    RAISE NOTICE '  ✓ i18n_translation_history';
    RAISE NOTICE '  ✓ i18n_contributors';
    RAISE NOTICE '  ✓ i18n_locale_details';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  ✓ create_translation_version()';
    RAISE NOTICE '  ✓ approve_translation()';
    RAISE NOTICE '  ✓ reject_translation()';
    RAISE NOTICE '  ✓ get_locale_hierarchy()';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  ✓ Row Level Security enabled';
    RAISE NOTICE '  ✓ Policies configured';
    RAISE NOTICE '  ✓ Permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Import existing translations';
    RAISE NOTICE '  2. Configure admin users';
    RAISE NOTICE '  3. Start translating!';
    RAISE NOTICE '========================================';
END $$;
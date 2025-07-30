-- ============================================
-- COMPLETE TRANSLATION SYSTEM WITH i18n_ PREFIX
-- ============================================
-- This script:
-- 1. Drops old translation tables
-- 2. Creates new tables with i18n_ prefix
-- 3. Sets up proper RLS policies
-- 4. Grants correct permissions

-- ============================================
-- 1. DROP OLD TABLES AND OBJECTS
-- ============================================

-- Drop old views
DROP VIEW IF EXISTS translations CASCADE;
DROP VIEW IF EXISTS locale_details CASCADE;
DROP VIEW IF EXISTS pending_translations CASCADE;
DROP VIEW IF EXISTS translation_history CASCADE;
DROP VIEW IF EXISTS contributors CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS create_translation_version CASCADE;
DROP FUNCTION IF EXISTS approve_translation CASCADE;
DROP FUNCTION IF EXISTS reject_translation CASCADE;
DROP FUNCTION IF EXISTS rollback_translation CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_versions CASCADE;
DROP FUNCTION IF EXISTS can_manage_translations CASCADE;

-- Drop old tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS translation_versions CASCADE;
DROP TABLE IF EXISTS locales CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- Drop new views if they exist (for re-running)
DROP VIEW IF EXISTS i18n_translations CASCADE;
DROP VIEW IF EXISTS i18n_locale_details CASCADE;
DROP VIEW IF EXISTS i18n_pending_translations CASCADE;
DROP VIEW IF EXISTS i18n_translation_history CASCADE;
DROP VIEW IF EXISTS i18n_contributors CASCADE;

-- Drop new functions if they exist
DROP FUNCTION IF EXISTS create_translation_version CASCADE;
DROP FUNCTION IF EXISTS approve_translation CASCADE;
DROP FUNCTION IF EXISTS reject_translation CASCADE;
DROP FUNCTION IF EXISTS rollback_translation CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_versions CASCADE;

-- Drop new tables if they exist
DROP TABLE IF EXISTS i18n_notifications CASCADE;
DROP TABLE IF EXISTS i18n_translation_versions CASCADE;
DROP TABLE IF EXISTS i18n_locales CASCADE;
DROP TABLE IF EXISTS i18n_languages CASCADE;

-- ============================================
-- 2. CREATE LANGUAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    rtl BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert common languages
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
    ('sl', 'Slovenian', 'Slovenščina', false),
    ('hr', 'Croatian', 'Hrvatski', false),
    ('hu', 'Hungarian', 'Magyar', false),
    ('et', 'Estonian', 'Eesti', false),
    ('lv', 'Latvian', 'Latviešu', false),
    ('lt', 'Lithuanian', 'Lietuvių', false),
    ('mt', 'Maltese', 'Malti', false),
    ('ga', 'Irish', 'Gaeilge', false),
    ('cy', 'Welsh', 'Cymraeg', false),
    ('hy', 'Armenian', 'Հայերեն', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. CREATE LOCALES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_locales (
    code TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES i18n_languages(code),
    region_code TEXT,
    name TEXT NOT NULL,
    native_name TEXT NOT NULL,
    flag_emoji TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    parent_locale TEXT REFERENCES i18n_locales(code),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert common locales
INSERT INTO i18n_locales (code, language_code, region_code, name, native_name, flag_emoji, parent_locale) VALUES
    -- English variants
    ('en', 'en', NULL, 'English', 'English', '🌐', NULL),
    ('en-GB', 'en', 'GB', 'English (UK)', 'English (UK)', '🇬🇧', 'en'),
    ('en-US', 'en', 'US', 'English (US)', 'English (US)', '🇺🇸', 'en'),
    ('en-AU', 'en', 'AU', 'English (Australia)', 'English (Australia)', '🇦🇺', 'en'),
    ('en-CA', 'en', 'CA', 'English (Canada)', 'English (Canada)', '🇨🇦', 'en'),
    
    -- French variants
    ('fr', 'fr', NULL, 'French', 'Français', '🇫🇷', NULL),
    ('fr-FR', 'fr', 'FR', 'French (France)', 'Français (France)', '🇫🇷', 'fr'),
    ('fr-CA', 'fr', 'CA', 'French (Canada)', 'Français (Canada)', '🇨🇦', 'fr'),
    ('fr-BE', 'fr', 'BE', 'French (Belgium)', 'Français (Belgique)', '🇧🇪', 'fr'),
    
    -- German variants
    ('de', 'de', NULL, 'German', 'Deutsch', '🇩🇪', NULL),
    ('de-DE', 'de', 'DE', 'German (Germany)', 'Deutsch (Deutschland)', '🇩🇪', 'de'),
    ('de-AT', 'de', 'AT', 'German (Austria)', 'Deutsch (Österreich)', '🇦🇹', 'de'),
    ('de-CH', 'de', 'CH', 'German (Switzerland)', 'Deutsch (Schweiz)', '🇨🇭', 'de'),
    
    -- Spanish variants
    ('es', 'es', NULL, 'Spanish', 'Español', '🇪🇸', NULL),
    ('es-ES', 'es', 'ES', 'Spanish (Spain)', 'Español (España)', '🇪🇸', 'es'),
    ('es-MX', 'es', 'MX', 'Spanish (Mexico)', 'Español (México)', '🇲🇽', 'es'),
    ('es-AR', 'es', 'AR', 'Spanish (Argentina)', 'Español (Argentina)', '🇦🇷', 'es'),
    
    -- Other base locales
    ('it', 'it', NULL, 'Italian', 'Italiano', '🇮🇹', NULL),
    ('it-IT', 'it', 'IT', 'Italian (Italy)', 'Italiano (Italia)', '🇮🇹', 'it'),
    
    ('pt', 'pt', NULL, 'Portuguese', 'Português', '🇵🇹', NULL),
    ('pt-PT', 'pt', 'PT', 'Portuguese (Portugal)', 'Português (Portugal)', '🇵🇹', 'pt'),
    ('pt-BR', 'pt', 'BR', 'Portuguese (Brazil)', 'Português (Brasil)', '🇧🇷', 'pt'),
    
    ('nl', 'nl', NULL, 'Dutch', 'Nederlands', '🇳🇱', NULL),
    ('nl-NL', 'nl', 'NL', 'Dutch (Netherlands)', 'Nederlands (Nederland)', '🇳🇱', 'nl'),
    ('nl-BE', 'nl', 'BE', 'Dutch (Belgium)', 'Nederlands (België)', '🇧🇪', 'nl'),
    
    ('pl', 'pl', NULL, 'Polish', 'Polski', '🇵🇱', NULL),
    ('pl-PL', 'pl', 'PL', 'Polish (Poland)', 'Polski (Polska)', '🇵🇱', 'pl'),
    
    ('ru', 'ru', NULL, 'Russian', 'Русский', '🇷🇺', NULL),
    ('ru-RU', 'ru', 'RU', 'Russian (Russia)', 'Русский (Россия)', '🇷🇺', 'ru'),
    
    ('sv', 'sv', NULL, 'Swedish', 'Svenska', '🇸🇪', NULL),
    ('sv-SE', 'sv', 'SE', 'Swedish (Sweden)', 'Svenska (Sverige)', '🇸🇪', 'sv'),
    
    ('no', 'no', NULL, 'Norwegian', 'Norsk', '🇳🇴', NULL),
    ('no-NO', 'no', 'NO', 'Norwegian (Norway)', 'Norsk (Norge)', '🇳🇴', 'no'),
    
    ('da', 'da', NULL, 'Danish', 'Dansk', '🇩🇰', NULL),
    ('da-DK', 'da', 'DK', 'Danish (Denmark)', 'Dansk (Danmark)', '🇩🇰', 'da'),
    
    ('fi', 'fi', NULL, 'Finnish', 'Suomi', '🇫🇮', NULL),
    ('fi-FI', 'fi', 'FI', 'Finnish (Finland)', 'Suomi (Suomi)', '🇫🇮', 'fi'),
    
    ('is', 'is', NULL, 'Icelandic', 'Íslenska', '🇮🇸', NULL),
    ('is-IS', 'is', 'IS', 'Icelandic (Iceland)', 'Íslenska (Ísland)', '🇮🇸', 'is'),
    
    ('el', 'el', NULL, 'Greek', 'Ελληνικά', '🇬🇷', NULL),
    ('el-GR', 'el', 'GR', 'Greek (Greece)', 'Ελληνικά (Ελλάδα)', '🇬🇷', 'el'),
    
    ('ro', 'ro', NULL, 'Romanian', 'Română', '🇷🇴', NULL),
    ('ro-RO', 'ro', 'RO', 'Romanian (Romania)', 'Română (România)', '🇷🇴', 'ro')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 4. CREATE TRANSLATION VERSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_translation_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    locale TEXT NOT NULL REFERENCES i18n_locales(code),
    value TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    auto_translated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    review_notes TEXT,
    previous_version_id UUID REFERENCES i18n_translation_versions(id),
    UNIQUE(key, locale, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_i18n_translation_versions_key_locale ON i18n_translation_versions(key, locale);
CREATE INDEX idx_i18n_translation_versions_status ON i18n_translation_versions(status);
CREATE INDEX idx_i18n_translation_versions_created_by ON i18n_translation_versions(created_by);

-- ============================================
-- 5. CREATE NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS i18n_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('translation_approved', 'translation_rejected', 'translation_needs_review')),
    related_translation_id UUID REFERENCES i18n_translation_versions(id),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_i18n_notifications_user_id ON i18n_notifications(user_id);
CREATE INDEX idx_i18n_notifications_read ON i18n_notifications(read);

-- ============================================
-- 6. CREATE FUNCTIONS
-- ============================================

-- Function to create a new translation version
CREATE OR REPLACE FUNCTION create_translation_version(
    p_key TEXT,
    p_locale TEXT,
    p_value TEXT,
    p_auto_translated BOOLEAN DEFAULT FALSE
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_version_number INTEGER;
    v_previous_id UUID;
    v_new_id UUID;
BEGIN
    -- Get the latest version number for this key/locale
    SELECT 
        COALESCE(MAX(version_number), 0) + 1,
        id
    INTO 
        v_version_number,
        v_previous_id
    FROM i18n_translation_versions
    WHERE key = p_key AND locale = p_locale
    GROUP BY id
    ORDER BY version_number DESC
    LIMIT 1;

    -- If no previous version, start at 1
    IF v_version_number IS NULL THEN
        v_version_number := 1;
    END IF;

    -- Insert the new version
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
            WHEN EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
            ) THEN 'approved'
            ELSE 'pending'
        END,
        p_auto_translated,
        auth.uid(),
        v_previous_id
    ) RETURNING id INTO v_new_id;

    RETURN v_new_id;
END;
$$;

-- Function to approve a translation
CREATE OR REPLACE FUNCTION approve_translation(
    p_version_id UUID,
    p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_translation RECORD;
    v_created_by UUID;
BEGIN
    -- Check if user has permission
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to approve translations';
    END IF;

    -- Get the translation details
    SELECT * INTO v_translation
    FROM i18n_translation_versions
    WHERE id = p_version_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Store the creator ID
    v_created_by := v_translation.created_by;

    -- Update all older versions of this key/locale to rejected
    UPDATE i18n_translation_versions
    SET status = 'rejected'
    WHERE key = v_translation.key 
    AND locale = v_translation.locale 
    AND status = 'approved'
    AND id != p_version_id;

    -- Approve this version
    UPDATE i18n_translation_versions
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        review_notes = p_notes
    WHERE id = p_version_id;

    -- Create notification for the translator
    IF v_created_by != auth.uid() THEN
        INSERT INTO i18n_notifications (
            user_id,
            type,
            related_translation_id,
            message
        ) VALUES (
            v_created_by,
            'translation_approved',
            p_version_id,
            'Your translation for "' || v_translation.key || '" in ' || v_translation.locale || ' has been approved'
        );
    END IF;

    RETURN TRUE;
END;
$$;

-- Function to reject a translation
CREATE OR REPLACE FUNCTION reject_translation(
    p_version_id UUID,
    p_notes TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_translation RECORD;
BEGIN
    -- Check if user has permission
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to reject translations';
    END IF;

    -- Get the translation details
    SELECT * INTO v_translation
    FROM i18n_translation_versions
    WHERE id = p_version_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Reject this version
    UPDATE i18n_translation_versions
    SET 
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        review_notes = p_notes
    WHERE id = p_version_id;

    -- Create notification for the translator
    IF v_translation.created_by != auth.uid() THEN
        INSERT INTO i18n_notifications (
            user_id,
            type,
            related_translation_id,
            message
        ) VALUES (
            v_translation.created_by,
            'translation_rejected',
            p_version_id,
            'Your translation for "' || v_translation.key || '" in ' || v_translation.locale || ' has been rejected: ' || p_notes
        );
    END IF;

    RETURN TRUE;
END;
$$;

-- Function to rollback to a previous version
CREATE OR REPLACE FUNCTION rollback_translation(
    p_key TEXT,
    p_locale TEXT,
    p_target_version INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_translation RECORD;
    v_new_id UUID;
BEGIN
    -- Check if user has permission
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to rollback translations';
    END IF;

    -- Get the target translation
    SELECT * INTO v_target_translation
    FROM i18n_translation_versions
    WHERE key = p_key 
    AND locale = p_locale 
    AND version_number = p_target_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target version not found';
    END IF;

    -- Create a new version with the old content
    v_new_id := create_translation_version(
        p_key,
        p_locale,
        v_target_translation.value,
        FALSE
    );

    -- Auto-approve the rollback
    PERFORM approve_translation(v_new_id, 'Rolled back to version ' || p_target_version);

    RETURN v_new_id;
END;
$$;

-- ============================================
-- 7. CREATE VIEWS
-- ============================================

-- View for approved translations (used by apps at runtime)
CREATE OR REPLACE VIEW i18n_translations AS
SELECT DISTINCT ON (key, locale)
    key,
    locale,
    value,
    auto_translated,
    updated_at
FROM (
    SELECT 
        key,
        locale,
        value,
        auto_translated,
        COALESCE(reviewed_at, created_at) as updated_at
    FROM i18n_translation_versions
    WHERE status = 'approved'
    ORDER BY key, locale, version_number DESC
) t;

-- View for pending translations (for review interface)
CREATE OR REPLACE VIEW i18n_pending_translations AS
SELECT 
    tv.*,
    up.email as created_by_email,
    up.full_name as created_by_name,
    (
        SELECT value 
        FROM i18n_translation_versions tv2 
        WHERE tv2.key = tv.key 
        AND tv2.locale = tv.locale 
        AND tv2.status = 'approved'
        ORDER BY version_number DESC 
        LIMIT 1
    ) as current_value
FROM i18n_translation_versions tv
LEFT JOIN user_profiles up ON tv.created_by = up.user_id
WHERE tv.status = 'pending'
ORDER BY tv.created_at DESC;

-- View for translation history
CREATE OR REPLACE VIEW i18n_translation_history AS
SELECT 
    tv.*,
    creator.email as created_by_email,
    creator.full_name as created_by_name,
    reviewer.email as reviewed_by_email,
    reviewer.full_name as reviewed_by_name
FROM i18n_translation_versions tv
LEFT JOIN user_profiles creator ON tv.created_by = creator.user_id
LEFT JOIN user_profiles reviewer ON tv.reviewed_by = reviewer.user_id
ORDER BY tv.key, tv.locale, tv.version_number DESC;

-- View for contributor statistics
CREATE OR REPLACE VIEW i18n_contributors AS
SELECT 
    up.user_id,
    up.email,
    up.full_name,
    COUNT(DISTINCT tv.id) as total_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'approved') as approved_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'pending') as pending_translations,
    COUNT(DISTINCT tv.id) FILTER (WHERE tv.status = 'rejected') as rejected_translations,
    COUNT(DISTINCT tv.locale) as locales_contributed,
    MAX(tv.created_at) as last_contribution
FROM user_profiles up
INNER JOIN i18n_translation_versions tv ON up.user_id = tv.created_by
GROUP BY up.user_id, up.email, up.full_name
ORDER BY total_translations DESC;

-- View for locale statistics
CREATE OR REPLACE VIEW i18n_locale_details AS
SELECT 
    l.code,
    l.name,
    l.native_name,
    l.flag_emoji,
    lg.name as language_name,
    lg.native_name as language_native_name,
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
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_translation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. CREATE RLS POLICIES
-- ============================================

-- Languages policies
CREATE POLICY "Languages are viewable by all" 
ON i18n_languages FOR SELECT 
USING (true);

CREATE POLICY "Languages are editable by admin users" 
ON i18n_languages FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Locales policies
CREATE POLICY "Locales are viewable by all" 
ON i18n_locales FOR SELECT 
USING (true);

CREATE POLICY "Locales are editable by admin users" 
ON i18n_locales FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Translation versions policies
-- Anyone can read approved translations (including anonymous users)
CREATE POLICY "Anyone can read approved translations" 
ON i18n_translation_versions FOR SELECT 
USING (status = 'approved');

-- Authenticated users can read all translations (for admin interface)
CREATE POLICY "Authenticated users can read all translations" 
ON i18n_translation_versions FOR SELECT 
USING (auth.role() = 'authenticated');

-- Authenticated users can create translations
CREATE POLICY "Authenticated users can create translations" 
ON i18n_translation_versions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Admin/editor users can update any translation
CREATE POLICY "Admin users can update any translation" 
ON i18n_translation_versions FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- Regular users can update their own pending translations
CREATE POLICY "Users can update their own pending translations" 
ON i18n_translation_versions FOR UPDATE 
USING (
    created_by = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    created_by = auth.uid() 
    AND status = 'pending'
);

-- Only admins can delete translations
CREATE POLICY "Only admins can delete translations" 
ON i18n_translation_versions FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Notification policies
CREATE POLICY "Users can view their own notifications" 
ON i18n_notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON i18n_notifications FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON i18n_notifications FOR INSERT 
WITH CHECK (true);

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON i18n_languages TO authenticated;
GRANT SELECT ON i18n_locales TO authenticated;
GRANT SELECT, INSERT, UPDATE ON i18n_translation_versions TO authenticated;
GRANT SELECT, UPDATE ON i18n_notifications TO authenticated;

-- Grant permissions to anonymous users (for runtime translation loading)
GRANT SELECT ON i18n_languages TO anon;
GRANT SELECT ON i18n_locales TO anon;
GRANT SELECT ON i18n_translation_versions TO anon;

-- Grant access to views
GRANT SELECT ON i18n_translations TO authenticated, anon;
GRANT SELECT ON i18n_locale_details TO authenticated, anon;
GRANT SELECT ON i18n_pending_translations TO authenticated;
GRANT SELECT ON i18n_translation_history TO authenticated;
GRANT SELECT ON i18n_contributors TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_translation_version TO authenticated;
GRANT EXECUTE ON FUNCTION approve_translation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_translation TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_translation TO authenticated;

-- ============================================
-- 11. CREATE HELPER FUNCTION FOR PERMISSION CHECK
-- ============================================

CREATE OR REPLACE FUNCTION can_manage_translations()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.role() != 'authenticated' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin or editor role
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'editor')
    );
END;
$$;

GRANT EXECUTE ON FUNCTION can_manage_translations TO authenticated;

-- ============================================
-- 12. CREATE CLEANUP FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete rejected versions older than 90 days
    DELETE FROM i18n_translation_versions
    WHERE status = 'rejected'
    AND reviewed_at < NOW() - INTERVAL '90 days';
    
    -- Delete old notifications
    DELETE FROM i18n_notifications
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================
-- 13. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Translation system with i18n_ prefix created successfully!';
    RAISE NOTICE 'Tables created: i18n_languages, i18n_locales, i18n_translation_versions, i18n_notifications';
    RAISE NOTICE 'Views created: i18n_translations, i18n_pending_translations, i18n_translation_history, i18n_contributors, i18n_locale_details';
    RAISE NOTICE 'Functions created: create_translation_version, approve_translation, reject_translation, rollback_translation';
    RAISE NOTICE 'RLS policies and permissions configured';
END $$;
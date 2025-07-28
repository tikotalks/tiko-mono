-- Enhanced Translation System with Versioning and Approval Workflow
-- This replaces the basic translations table with a versioned system

-- ============================================
-- 1. DROP OLD TRANSLATIONS TABLE (if migrating)
-- ============================================
-- Uncomment these lines if migrating from the old system:
-- DROP VIEW IF EXISTS locale_details CASCADE;
-- DROP VIEW IF EXISTS missing_translations CASCADE;
-- DROP VIEW IF EXISTS translation_statistics CASCADE;
-- DROP TABLE IF EXISTS translations CASCADE;

-- ============================================
-- 2. CREATE TRANSLATION VERSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS translation_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL,
    locale TEXT NOT NULL REFERENCES locales(code),
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
    previous_version_id UUID REFERENCES translation_versions(id),
    
    -- Ensure unique version numbers per key/locale
    UNIQUE(key, locale, version_number)
);

-- Create indexes for performance
CREATE INDEX idx_translation_versions_key_locale ON translation_versions(key, locale);
CREATE INDEX idx_translation_versions_status ON translation_versions(status);
CREATE INDEX idx_translation_versions_created_by ON translation_versions(created_by);
CREATE INDEX idx_translation_versions_previous ON translation_versions(previous_version_id);

-- ============================================
-- 3. CREATE VIEW FOR CURRENT TRANSLATIONS
-- ============================================

-- This view shows only the latest approved version for each key/locale
CREATE OR REPLACE VIEW translations AS
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
    FROM translation_versions
    WHERE status = 'approved'
    ORDER BY key, locale, version_number DESC
)
SELECT * FROM latest_approved;

-- View for pending translations (awaiting approval)
CREATE OR REPLACE VIEW pending_translations AS
SELECT 
    tv.*,
    u_creator.email as creator_email,
    u_creator.raw_user_meta_data->>'full_name' as creator_name,
    prev.value as previous_value,
    prev.version_number as previous_version
FROM translation_versions tv
LEFT JOIN auth.users u_creator ON tv.created_by = u_creator.id
LEFT JOIN translation_versions prev ON tv.previous_version_id = prev.id
WHERE tv.status = 'pending'
ORDER BY tv.created_at DESC;

-- ============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE translation_versions ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved translations
CREATE POLICY "Approved translations are viewable by all authenticated users" 
ON translation_versions
FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND status = 'approved'
);

-- Users can see their own pending/rejected translations
CREATE POLICY "Users can view their own translations" 
ON translation_versions
FOR SELECT 
USING (
    auth.uid() = created_by
);

-- Admins and editors can see all translations
CREATE POLICY "Admins can view all translations" 
ON translation_versions
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role IN ('admin', 'editor')
    )
);

-- Any authenticated user can create translations (as pending)
CREATE POLICY "Authenticated users can create pending translations" 
ON translation_versions
FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' 
    AND status = 'pending'
    AND created_by = auth.uid()
);

-- Only admins/editors can approve/reject translations
CREATE POLICY "Only admins can update translation status" 
ON translation_versions
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT id FROM user_profiles 
        WHERE role IN ('admin', 'editor')
    )
);

-- Users can update their own pending translations
CREATE POLICY "Users can update their own pending translations" 
ON translation_versions
FOR UPDATE 
USING (
    created_by = auth.uid() 
    AND status = 'pending'
)
WITH CHECK (
    created_by = auth.uid() 
    AND status = 'pending'
);

-- ============================================
-- 5. FUNCTIONS FOR TRANSLATION MANAGEMENT
-- ============================================

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
    WHERE id = auth.uid();
    
    -- Get the latest version for this key/locale
    SELECT id, version_number 
    INTO v_previous_id, v_version_number
    FROM translation_versions
    WHERE key = p_key AND locale = p_locale
    ORDER BY version_number DESC
    LIMIT 1;
    
    -- Increment version number or start at 1
    v_version_number := COALESCE(v_version_number + 1, 1);
    
    -- Insert new version
    INSERT INTO translation_versions (
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
        UPDATE translation_versions
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
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Only admins and editors can approve translations';
    END IF;
    
    -- Update the translation status
    UPDATE translation_versions
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
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Only admins and editors can reject translations';
    END IF;
    
    -- Update the translation status
    UPDATE translation_versions
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        review_notes = p_notes
    WHERE id = p_version_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback to a previous version
CREATE OR REPLACE FUNCTION rollback_translation(
    p_key TEXT,
    p_locale TEXT,
    p_target_version INTEGER
) RETURNS UUID AS $$
DECLARE
    v_target_value TEXT;
    v_new_id UUID;
    v_user_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF v_user_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Only admins and editors can rollback translations';
    END IF;
    
    -- Get the value from the target version
    SELECT value INTO v_target_value
    FROM translation_versions
    WHERE key = p_key 
    AND locale = p_locale 
    AND version_number = p_target_version
    LIMIT 1;
    
    IF v_target_value IS NULL THEN
        RAISE EXCEPTION 'Target version not found';
    END IF;
    
    -- Create a new version with the old value
    v_new_id := create_translation_version(p_key, p_locale, v_target_value, FALSE);
    
    -- Add a note about the rollback
    UPDATE translation_versions
    SET review_notes = format('Rolled back to version %s', p_target_version)
    WHERE id = v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRANSLATION HISTORY VIEW
-- ============================================

CREATE OR REPLACE VIEW translation_history AS
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
FROM translation_versions tv
LEFT JOIN auth.users u_creator ON tv.created_by = u_creator.id
LEFT JOIN auth.users u_reviewer ON tv.reviewed_by = u_reviewer.id
LEFT JOIN locales l ON tv.locale = l.code
ORDER BY tv.key, tv.locale, tv.version_number DESC;

-- ============================================
-- 7. CONTRIBUTOR STATISTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW translation_contributors AS
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
JOIN translation_versions tv ON tv.created_by = u.id
GROUP BY u.id, u.email, u.raw_user_meta_data->>'full_name'
ORDER BY approved_translations DESC, total_translations DESC;

-- ============================================
-- 8. UPDATED STATISTICS VIEWS
-- ============================================

-- Update locale details view to work with versioned system
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
    (SELECT COUNT(DISTINCT key) FROM translations t WHERE t.locale = l.code) as translation_count,
    (SELECT COUNT(DISTINCT tv.key) FROM translation_versions tv WHERE tv.locale = l.code AND tv.status = 'pending') as pending_count,
    (SELECT COUNT(DISTINCT key) FROM translation_versions) as total_keys,
    CASE 
        WHEN (SELECT COUNT(DISTINCT key) FROM translation_versions) > 0 
        THEN ROUND(((SELECT COUNT(DISTINCT key) FROM translations t WHERE t.locale = l.code)::numeric / 
              (SELECT COUNT(DISTINCT key) FROM translation_versions)::numeric) * 100, 2)
        ELSE 0
    END as completion_percentage
FROM locales l
JOIN languages lg ON l.language_code = lg.code
ORDER BY lg.name, l.name;

-- ============================================
-- 9. NOTIFICATION SYSTEM (Optional)
-- ============================================

-- Table for translation review notifications
CREATE TABLE IF NOT EXISTS translation_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    translation_version_id UUID REFERENCES translation_versions(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('new_translation', 'approved', 'rejected', 'needs_review')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_notifications_user ON translation_notifications(user_id);
CREATE INDEX idx_notifications_read ON translation_notifications(read);

-- Trigger to create notifications when translations need review
CREATE OR REPLACE FUNCTION notify_translation_review() RETURNS TRIGGER AS $$
BEGIN
    -- Notify all admins/editors when a new translation needs review
    IF NEW.status = 'pending' AND OLD.status IS NULL THEN
        INSERT INTO translation_notifications (user_id, translation_version_id, type)
        SELECT id, NEW.id, 'needs_review'
        FROM user_profiles
        WHERE role IN ('admin', 'editor')
        AND id != NEW.created_by;
    END IF;
    
    -- Notify the creator when their translation is reviewed
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        INSERT INTO translation_notifications (user_id, translation_version_id, type)
        VALUES (NEW.created_by, NEW.id, NEW.status);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER translation_review_notifications
    AFTER INSERT OR UPDATE ON translation_versions
    FOR EACH ROW EXECUTE FUNCTION notify_translation_review();

-- ============================================
-- 10. MIGRATION FROM OLD SYSTEM (if applicable)
-- ============================================

-- If migrating from the old translations table, run this:
/*
INSERT INTO translation_versions (key, locale, value, version_number, status, auto_translated, created_by, reviewed_at, reviewed_by)
SELECT 
    key,
    locale,
    value,
    1 as version_number,
    'approved' as status,
    auto_translated,
    COALESCE(created_by, (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)) as created_by,
    NOW() as reviewed_at,
    COALESCE(created_by, (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)) as reviewed_by
FROM translations;
*/

-- ============================================
-- 11. GRANT PERMISSIONS
-- ============================================

-- Grant permissions
GRANT SELECT ON translations TO authenticated;
GRANT SELECT ON pending_translations TO authenticated;
GRANT SELECT ON translation_history TO authenticated;
GRANT SELECT ON translation_contributors TO authenticated;
GRANT EXECUTE ON FUNCTION create_translation_version TO authenticated;
GRANT EXECUTE ON FUNCTION approve_translation TO authenticated;
GRANT EXECUTE ON FUNCTION reject_translation TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_translation TO authenticated;

-- ============================================
-- 12. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Translation versioning system setup completed!';
    RAISE NOTICE '';
    RAISE NOTICE 'New features:';
    RAISE NOTICE '  ✓ Version history for all translations';
    RAISE NOTICE '  ✓ Approval workflow (pending → approved/rejected)';
    RAISE NOTICE '  ✓ Contributor system - anyone can suggest translations';
    RAISE NOTICE '  ✓ Rollback to previous versions';
    RAISE NOTICE '  ✓ Notification system for reviews';
    RAISE NOTICE '  ✓ Contributor statistics';
    RAISE NOTICE '';
    RAISE NOTICE 'Key concepts:';
    RAISE NOTICE '  - Regular users create "pending" translations';
    RAISE NOTICE '  - Admins/editors review and approve/reject';
    RAISE NOTICE '  - Only approved translations are shown in apps';
    RAISE NOTICE '  - Full history is maintained for audit/rollback';
END $$;
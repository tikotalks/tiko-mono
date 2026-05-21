-- Simple script to populate i18n_languages table
-- Run this in Supabase SQL editor

-- First check if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'i18n_languages') THEN
        RAISE NOTICE 'Table i18n_languages exists';
    ELSE
        RAISE EXCEPTION 'Table i18n_languages does not exist. Please create i18n tables first.';
    END IF;
END $$;

-- Insert languages (will skip if they already exist)
INSERT INTO i18n_languages (code, name, native_name, is_active) VALUES
('en', 'English', 'English', true),
('nl', 'Dutch', 'Nederlands', true),
('fr', 'French', 'Français', true),
('de', 'German', 'Deutsch', true),
('es', 'Spanish', 'Español', true),
('it', 'Italian', 'Italiano', true),
('pt', 'Portuguese', 'Português', true)
ON CONFLICT (code) DO NOTHING;

-- Show what we have
SELECT * FROM i18n_languages ORDER BY code;
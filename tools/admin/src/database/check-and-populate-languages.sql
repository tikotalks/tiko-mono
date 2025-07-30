-- Check if i18n_languages table exists and has data
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'i18n_languages'
) as table_exists;

-- Count existing languages
SELECT COUNT(*) as language_count FROM i18n_languages;

-- If empty, insert default languages
INSERT INTO i18n_languages (code, name, native_name, is_active)
SELECT * FROM (VALUES
    ('en', 'English', 'English', true),
    ('en-GB', 'English (UK)', 'English (UK)', true),
    ('en-US', 'English (US)', 'English (US)', true),
    ('nl', 'Dutch', 'Nederlands', true),
    ('fr', 'French', 'Français', true),
    ('de', 'German', 'Deutsch', true),
    ('es', 'Spanish', 'Español', true),
    ('it', 'Italian', 'Italiano', true),
    ('pt', 'Portuguese', 'Português', true),
    ('pl', 'Polish', 'Polski', true),
    ('ro', 'Romanian', 'Română', true),
    ('sv', 'Swedish', 'Svenska', true),
    ('da', 'Danish', 'Dansk', true),
    ('no', 'Norwegian', 'Norsk', true),
    ('fi', 'Finnish', 'Suomi', true),
    ('cs', 'Czech', 'Čeština', true),
    ('sk', 'Slovak', 'Slovenčina', true),
    ('hu', 'Hungarian', 'Magyar', true),
    ('bg', 'Bulgarian', 'Български', true),
    ('el', 'Greek', 'Ελληνικά', true),
    ('ru', 'Russian', 'Русский', true),
    ('et', 'Estonian', 'Eesti', true),
    ('lv', 'Latvian', 'Latviešu', true),
    ('lt', 'Lithuanian', 'Lietuvių', true),
    ('sl', 'Slovenian', 'Slovenščina', true),
    ('hr', 'Croatian', 'Hrvatski', true),
    ('mt', 'Maltese', 'Malti', true),
    ('cy', 'Welsh', 'Cymraeg', true),
    ('ga', 'Irish', 'Gaeilge', true),
    ('is', 'Icelandic', 'Íslenska', true),
    ('hy', 'Armenian', 'Հայերեն', true)
) AS v(code, name, native_name, is_active)
WHERE NOT EXISTS (SELECT 1 FROM i18n_languages);

-- Show all languages after insert
SELECT * FROM i18n_languages ORDER BY code;
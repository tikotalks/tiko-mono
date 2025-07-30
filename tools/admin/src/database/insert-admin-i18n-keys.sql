-- Insert admin.i18n translation keys that are used in the admin UI

-- First, ensure the admin.i18n category exists
INSERT INTO i18n_keys (key, category, description, created_by, updated_by)
VALUES 
  ('admin.i18n.languages.title', 'admin.i18n', 'Title for languages page', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.description', 'admin.i18n', 'Description for languages page', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.addLanguage', 'admin.i18n', 'Button text to add a new language', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.addKey', 'admin.i18n', 'Button text to add a new translation key', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.code', 'admin.i18n', 'Language code column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.name', 'admin.i18n', 'Language name column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.nativeName', 'admin.i18n', 'Native name column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.coverage', 'admin.i18n', 'Coverage column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.status', 'admin.i18n', 'Status column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.actions', 'admin.i18n', 'Actions column header', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.active', 'admin.i18n', 'Active status label', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.inactive', 'admin.i18n', 'Inactive status label', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.uploadTranslations', 'admin.i18n', 'Upload translations button tooltip', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.viewDetails', 'admin.i18n', 'View details button tooltip', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.deactivate', 'admin.i18n', 'Deactivate language button tooltip', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.activate', 'admin.i18n', 'Activate language button tooltip', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.uploadTitle', 'admin.i18n', 'Upload dialog title', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.selectFile', 'admin.i18n', 'Select file button text', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.languageCode', 'admin.i18n', 'Language code input label', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.languageCodePlaceholder', 'admin.i18n', 'Language code input placeholder', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.languageName', 'admin.i18n', 'Language name input label', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.languageNamePlaceholder', 'admin.i18n', 'Language name input placeholder', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.nativeNamePlaceholder', 'admin.i18n', 'Native name input placeholder', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.noLanguages', 'admin.i18n', 'No languages found message', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1)),
  ('admin.i18n.languages.checkDatabase', 'admin.i18n', 'Check database message', (SELECT id FROM auth.users LIMIT 1), (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (key) DO NOTHING;

-- Insert English translations for these keys
INSERT INTO i18n_translations (key_id, language_code, value, is_published, created_by, updated_by)
SELECT 
  k.id,
  'en',
  CASE k.key
    WHEN 'admin.i18n.languages.title' THEN 'Languages'
    WHEN 'admin.i18n.languages.description' THEN 'Manage supported languages and their translations'
    WHEN 'admin.i18n.languages.addLanguage' THEN 'Add Language'
    WHEN 'admin.i18n.languages.addKey' THEN 'Add Translation Key'
    WHEN 'admin.i18n.languages.code' THEN 'Code'
    WHEN 'admin.i18n.languages.name' THEN 'Language'
    WHEN 'admin.i18n.languages.nativeName' THEN 'Native Name'
    WHEN 'admin.i18n.languages.coverage' THEN 'Coverage'
    WHEN 'admin.i18n.languages.status' THEN 'Status'
    WHEN 'admin.i18n.languages.actions' THEN 'Actions'
    WHEN 'admin.i18n.languages.active' THEN 'Active'
    WHEN 'admin.i18n.languages.inactive' THEN 'Inactive'
    WHEN 'admin.i18n.languages.uploadTranslations' THEN 'Upload translations'
    WHEN 'admin.i18n.languages.viewDetails' THEN 'View details'
    WHEN 'admin.i18n.languages.deactivate' THEN 'Deactivate'
    WHEN 'admin.i18n.languages.activate' THEN 'Activate'
    WHEN 'admin.i18n.languages.uploadTitle' THEN 'Upload Translations for {language}'
    WHEN 'admin.i18n.languages.selectFile' THEN 'Select File'
    WHEN 'admin.i18n.languages.languageCode' THEN 'Language Code'
    WHEN 'admin.i18n.languages.languageCodePlaceholder' THEN 'e.g., fr-FR'
    WHEN 'admin.i18n.languages.languageName' THEN 'Language Name'
    WHEN 'admin.i18n.languages.languageNamePlaceholder' THEN 'e.g., French (France)'
    WHEN 'admin.i18n.languages.nativeNamePlaceholder' THEN 'e.g., Français (France)'
    WHEN 'admin.i18n.languages.noLanguages' THEN 'No languages found'
    WHEN 'admin.i18n.languages.checkDatabase' THEN 'Please run the SQL script to populate languages'
  END,
  true,
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM auth.users LIMIT 1)
FROM i18n_keys k
WHERE k.key IN (
  'admin.i18n.languages.title',
  'admin.i18n.languages.description',
  'admin.i18n.languages.addLanguage',
  'admin.i18n.languages.addKey',
  'admin.i18n.languages.code',
  'admin.i18n.languages.name',
  'admin.i18n.languages.nativeName',
  'admin.i18n.languages.coverage',
  'admin.i18n.languages.status',
  'admin.i18n.languages.actions',
  'admin.i18n.languages.active',
  'admin.i18n.languages.inactive',
  'admin.i18n.languages.uploadTranslations',
  'admin.i18n.languages.viewDetails',
  'admin.i18n.languages.deactivate',
  'admin.i18n.languages.activate',
  'admin.i18n.languages.uploadTitle',
  'admin.i18n.languages.selectFile',
  'admin.i18n.languages.languageCode',
  'admin.i18n.languages.languageCodePlaceholder',
  'admin.i18n.languages.languageName',
  'admin.i18n.languages.languageNamePlaceholder',
  'admin.i18n.languages.nativeNamePlaceholder',
  'admin.i18n.languages.noLanguages',
  'admin.i18n.languages.checkDatabase'
)
ON CONFLICT (key_id, language_code) DO NOTHING;

-- Also insert en-GB translations (copy from en)
INSERT INTO i18n_translations (key_id, language_code, value, is_published, created_by, updated_by)
SELECT 
  key_id,
  'en-GB',
  value,
  is_published,
  created_by,
  updated_by
FROM i18n_translations
WHERE language_code = 'en'
AND key_id IN (
  SELECT id FROM i18n_keys 
  WHERE key LIKE 'admin.i18n.languages.%'
)
ON CONFLICT (key_id, language_code) DO NOTHING;
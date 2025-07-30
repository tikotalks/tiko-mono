-- Debug SQL to check translation counts

-- 1. Check total number of keys
SELECT COUNT(*) as total_keys FROM i18n_keys;

-- 2. Check translations per language
SELECT 
  language_code,
  COUNT(*) as total_translations,
  COUNT(DISTINCT key_id) as unique_keys_translated,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_translations,
  COUNT(CASE WHEN is_published = false THEN 1 END) as pending_translations
FROM i18n_translations
GROUP BY language_code
ORDER BY language_code;

-- 3. Check if we have any translations at all
SELECT * FROM i18n_translations LIMIT 10;

-- 4. Check coverage per language with latest version only
WITH latest_translations AS (
  SELECT DISTINCT ON (key_id, language_code)
    key_id,
    language_code,
    value,
    is_published,
    version
  FROM i18n_translations
  ORDER BY key_id, language_code, version DESC
),
total_keys AS (
  SELECT COUNT(*) as total_key_count FROM i18n_keys
)
SELECT 
  l.code,
  l.name,
  COUNT(DISTINCT lt.key_id) as translated_keys,
  tk.total_key_count as total_keys,
  ROUND((COUNT(DISTINCT lt.key_id)::numeric / tk.total_key_count::numeric) * 100, 2) as coverage_percent
FROM i18n_languages l
LEFT JOIN latest_translations lt ON l.code = lt.language_code
CROSS JOIN total_keys tk
GROUP BY l.code, l.name, tk.total_key_count
ORDER BY l.code;
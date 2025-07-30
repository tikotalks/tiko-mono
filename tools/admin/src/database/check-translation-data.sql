-- Simple checks to understand the data

-- 1. How many keys do we have?
SELECT 'Total Keys:' as metric, COUNT(*) as count FROM i18n_keys;

-- 2. How many translations do we have?
SELECT 'Total Translations:' as metric, COUNT(*) as count FROM i18n_translations;

-- 3. Translations by language
SELECT 
  'Translations for ' || language_code as metric, 
  COUNT(*) as count 
FROM i18n_translations 
GROUP BY language_code
ORDER BY language_code;

-- 4. Sample of actual translations
SELECT 
  t.language_code,
  k.key,
  t.value,
  t.is_published,
  t.version
FROM i18n_translations t
JOIN i18n_keys k ON t.key_id = k.id
WHERE t.language_code IN ('en', 'nl')
LIMIT 20;

-- 5. Check if key_id references are valid
SELECT 
  'Translations with invalid key_id' as issue,
  COUNT(*) as count
FROM i18n_translations t
LEFT JOIN i18n_keys k ON t.key_id = k.id
WHERE k.id IS NULL;
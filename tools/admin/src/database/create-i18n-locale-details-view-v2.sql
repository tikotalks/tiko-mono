-- Create the i18n_locale_details view with better handling of translation counts
-- This version properly counts only the latest version of each translation

-- Drop the view if it exists
DROP VIEW IF EXISTS public.i18n_locale_details;

-- Create the view with proper versioning support
CREATE VIEW public.i18n_locale_details AS
WITH 
-- Get total number of keys
total_keys AS (
  SELECT COUNT(*) as total_key_count
  FROM public.i18n_keys
),
-- Get only the latest version of each translation per key/language
latest_translations AS (
  SELECT DISTINCT ON (key_id, language_code)
    key_id,
    language_code,
    value,
    is_published,
    version
  FROM public.i18n_translations
  WHERE value IS NOT NULL AND value != ''
  ORDER BY key_id, language_code, version DESC
),
-- Calculate stats per language
language_stats AS (
  SELECT 
    l.code,
    l.name,
    l.native_name,
    l.is_active,
    COUNT(DISTINCT lt.key_id) as translation_count,
    COUNT(DISTINCT CASE WHEN lt.is_published = false THEN lt.key_id END) as pending_count,
    COUNT(DISTINCT CASE WHEN lt.is_published = true THEN lt.key_id END) as published_count
  FROM public.i18n_languages l
  LEFT JOIN latest_translations lt ON l.code = lt.language_code
  GROUP BY l.code, l.name, l.native_name, l.is_active
)
-- Final select with percentage calculation
SELECT 
  ls.code,
  ls.name,
  ls.native_name,
  ls.is_active,
  COALESCE(ls.translation_count, 0) as translation_count,
  COALESCE(ls.pending_count, 0) as pending_count,
  COALESCE(ls.published_count, 0) as published_count,
  tk.total_key_count as total_keys,
  CASE 
    WHEN tk.total_key_count > 0 THEN 
      ROUND((COALESCE(ls.translation_count, 0)::numeric / tk.total_key_count::numeric) * 100, 2)
    ELSE 0
  END as completion_percentage
FROM language_stats ls
CROSS JOIN total_keys tk
ORDER BY ls.code;

-- Grant permissions for the view
GRANT SELECT ON public.i18n_locale_details TO anon;
GRANT SELECT ON public.i18n_locale_details TO authenticated;

-- Add comment
COMMENT ON VIEW public.i18n_locale_details IS 'Provides aggregated statistics for each language including translation counts and completion percentages, considering only the latest version of each translation';
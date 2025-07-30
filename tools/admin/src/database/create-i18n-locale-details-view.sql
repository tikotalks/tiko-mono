-- Create the i18n_locale_details view that provides language statistics
-- This view aggregates translation counts and coverage percentages for each language

-- Drop the view if it exists
DROP VIEW IF EXISTS public.i18n_locale_details;

-- Create the view
CREATE VIEW public.i18n_locale_details AS
WITH total_keys AS (
  -- Get the total number of translation keys
  SELECT COUNT(*) as total_key_count
  FROM public.i18n_keys
),
language_stats AS (
  -- Get translation counts per language
  SELECT 
    l.code,
    l.name,
    l.native_name,
    l.is_active,
    COUNT(DISTINCT t.key_id) as translation_count,
    COUNT(DISTINCT CASE WHEN t.is_published = false THEN t.key_id END) as pending_count
  FROM public.i18n_languages l
  LEFT JOIN public.i18n_translations t ON l.code = t.language_code
  GROUP BY l.code, l.name, l.native_name, l.is_active
)
SELECT 
  ls.code,
  ls.name,
  ls.native_name,
  ls.is_active,
  COALESCE(ls.translation_count, 0) as translation_count,
  COALESCE(ls.pending_count, 0) as pending_count,
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
COMMENT ON VIEW public.i18n_locale_details IS 'Provides aggregated statistics for each language including translation counts and completion percentages';
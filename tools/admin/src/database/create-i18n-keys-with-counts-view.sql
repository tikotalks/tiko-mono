-- Create a view that provides translation keys with their translation counts
-- This view is optimized for the admin interface to show keys with counts

-- Drop existing view if it exists
DROP VIEW IF EXISTS i18n_keys_with_counts;

-- Create the view
CREATE VIEW i18n_keys_with_counts AS
SELECT 
  k.id,
  k.key,
  k.description,
  k.category,
  k.created_at,
  k.created_by,
  COUNT(DISTINCT t.id) as translation_count
FROM i18n_keys k
LEFT JOIN i18n_translations t ON k.id = t.key_id AND t.is_published = true
GROUP BY k.id, k.key, k.description, k.category, k.created_at, k.created_by
ORDER BY k.key;

-- Grant permissions
GRANT SELECT ON i18n_keys_with_counts TO authenticated;
GRANT SELECT ON i18n_keys_with_counts TO anon;

-- Add comment
COMMENT ON VIEW i18n_keys_with_counts IS 'Translation keys with count of published translations for each key';
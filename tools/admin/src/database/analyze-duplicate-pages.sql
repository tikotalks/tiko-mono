-- Comprehensive analysis of duplicate pages in the marketing project
-- This query provides detailed information about duplicates and suggestions for resolution

-- 1. Find the marketing project details
WITH marketing_project AS (
  SELECT 
    id, 
    name, 
    slug,
    languages,
    default_language
  FROM content_projects 
  WHERE slug = 'marketing'
),

-- 2. Find all duplicate pages by slug and language_code
duplicate_pages AS (
  SELECT 
    p.slug,
    p.language_code,
    COUNT(*) as duplicate_count
  FROM content_pages p
  JOIN marketing_project mp ON p.project_id = mp.id
  GROUP BY p.slug, p.language_code
  HAVING COUNT(*) > 1
)

-- 3. Get detailed information about duplicates
SELECT 
  '=== DUPLICATE PAGES FOUND ===' as section,
  dp.slug,
  dp.language_code,
  dp.duplicate_count,
  json_agg(
    json_build_object(
      'page_id', p.id,
      'title', p.title,
      'full_path', p.full_path,
      'is_published', p.is_published,
      'is_home', p.is_home,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'has_sections', EXISTS(SELECT 1 FROM content_page_sections WHERE page_id = p.id),
      'section_count', (SELECT COUNT(*) FROM content_page_sections WHERE page_id = p.id),
      'has_field_values', EXISTS(SELECT 1 FROM content_field_values WHERE page_id = p.id),
      'field_value_count', (SELECT COUNT(*) FROM content_field_values WHERE page_id = p.id)
    ) ORDER BY p.created_at
  ) as duplicate_details
FROM duplicate_pages dp
JOIN content_pages p ON p.slug = dp.slug AND p.language_code = dp.language_code
JOIN marketing_project mp ON p.project_id = mp.id
GROUP BY dp.slug, dp.language_code, dp.duplicate_count;

-- 4. Summary statistics
SELECT 
  '=== SUMMARY ===' as section,
  COUNT(DISTINCT p.id) as total_pages,
  COUNT(DISTINCT p.slug || '-' || p.language_code) as unique_slug_language_combinations,
  COUNT(DISTINCT p.slug) as unique_slugs,
  COUNT(DISTINCT p.language_code) as languages_used,
  SUM(CASE WHEN dp.slug IS NOT NULL THEN 1 ELSE 0 END) as pages_with_duplicates
FROM content_pages p
JOIN marketing_project mp ON p.project_id = mp.id
LEFT JOIN duplicate_pages dp ON p.slug = dp.slug AND p.language_code = dp.language_code;

-- 5. Suggested fixes - identify which duplicates to keep
WITH duplicate_details AS (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.slug, p.language_code ORDER BY 
      p.is_published DESC,  -- Prefer published pages
      p.updated_at DESC,    -- Then most recently updated
      p.created_at ASC      -- Then oldest (original)
    ) as keep_priority,
    COUNT(*) OVER (PARTITION BY p.slug, p.language_code) as total_duplicates
  FROM content_pages p
  JOIN marketing_project mp ON p.project_id = mp.id
)
SELECT 
  '=== SUGGESTED FIXES ===' as section,
  slug,
  language_code,
  CASE 
    WHEN keep_priority = 1 THEN 'KEEP'
    ELSE 'DELETE'
  END as suggested_action,
  id as page_id,
  title,
  is_published,
  updated_at,
  'Reason: ' || 
  CASE 
    WHEN keep_priority = 1 THEN 
      CASE 
        WHEN is_published THEN 'Published page'
        ELSE 'Most recently updated'
      END
    ELSE 'Duplicate - less recent or unpublished'
  END as reason
FROM duplicate_details
WHERE total_duplicates > 1
ORDER BY slug, language_code, keep_priority;

-- 6. SQL commands to fix duplicates (commented out for safety)
SELECT 
  '=== DELETE COMMANDS (REVIEW BEFORE RUNNING) ===' as section,
  '-- DELETE FROM content_pages WHERE id = ''' || dd.id || '''; -- ' || dd.title || ' (' || dd.slug || '/' || dd.language_code || ')' as delete_command
FROM (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.slug, p.language_code ORDER BY 
      p.is_published DESC,
      p.updated_at DESC,
      p.created_at ASC
    ) as keep_priority
  FROM content_pages p
  JOIN marketing_project mp ON p.project_id = mp.id
) dd
WHERE keep_priority > 1
ORDER BY dd.slug, dd.language_code;
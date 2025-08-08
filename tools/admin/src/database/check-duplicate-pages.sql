-- Check for duplicate pages with the same slug in the marketing project
-- This query will find any pages that have the same slug and language_code combination

-- First, find the marketing project
WITH marketing_project AS (
  SELECT id, name, slug 
  FROM content_projects 
  WHERE slug = 'marketing'
)

-- Check for duplicate pages by slug and language_code
SELECT 
  p.slug,
  p.language_code,
  COUNT(*) as duplicate_count,
  array_agg(
    json_build_object(
      'id', p.id,
      'title', p.title,
      'full_path', p.full_path,
      'is_published', p.is_published,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ) ORDER BY p.created_at
  ) as page_details
FROM content_pages p
JOIN marketing_project mp ON p.project_id = mp.id
GROUP BY p.slug, p.language_code
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, p.slug, p.language_code;

-- Also check all pages in the marketing project for context
SELECT 
  'All Marketing Pages' as query_type,
  p.id,
  p.slug,
  p.title,
  p.language_code,
  p.full_path,
  p.is_published,
  p.is_home,
  p.created_at,
  p.updated_at
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
ORDER BY p.language_code, p.slug;

-- Check if there are any constraint violations
SELECT 
  'Constraint Check' as query_type,
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'content_pages'::regclass
AND conname LIKE '%unique%';

-- Check the unique constraint specifically
SELECT 
  'Unique Constraint Details' as query_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'content_pages'
AND indexname LIKE '%unique%' OR indexname LIKE '%slug%';
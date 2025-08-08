-- Validate page constraints and check for potential issues causing duplicates

-- 1. Check the unique constraint on content_pages
SELECT 
  '=== UNIQUE CONSTRAINTS ===' as section,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_pages'::regclass
AND contype = 'u';

-- 2. Check all indexes on content_pages
SELECT 
  '=== INDEXES ON CONTENT_PAGES ===' as section,
  indexname,
  indexdef,
  CASE 
    WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE INDEX'
    ELSE 'REGULAR INDEX'
  END as index_type
FROM pg_indexes
WHERE tablename = 'content_pages'
ORDER BY index_type DESC, indexname;

-- 3. Check for any disabled constraints
SELECT 
  '=== CONSTRAINT STATUS ===' as section,
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type,
  CASE 
    WHEN con.convalidated THEN 'VALIDATED'
    ELSE 'NOT VALIDATED'
  END as validation_status,
  CASE 
    WHEN con.condeferrable THEN 'DEFERRABLE'
    ELSE 'NOT DEFERRABLE'
  END as deferrable_status
FROM pg_constraint con
JOIN pg_class c ON con.conrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'content_pages';

-- 4. Check for orphaned pages (pages with non-existent project_id)
SELECT 
  '=== ORPHANED PAGES ===' as section,
  p.id,
  p.slug,
  p.language_code,
  p.project_id,
  'Project does not exist' as issue
FROM content_pages p
LEFT JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.id IS NULL;

-- 5. Check for pages violating language constraints
WITH project_languages AS (
  SELECT 
    id as project_id,
    name as project_name,
    slug as project_slug,
    unnest(languages) as allowed_language
  FROM content_projects
)
SELECT 
  '=== LANGUAGE CONSTRAINT VIOLATIONS ===' as section,
  p.id as page_id,
  p.slug,
  p.language_code,
  pl.project_name,
  pl.project_slug,
  array_agg(DISTINCT pl.allowed_language) as allowed_languages,
  'Page language not in project languages' as issue
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
LEFT JOIN project_languages pl ON pl.project_id = p.project_id AND pl.allowed_language = p.language_code
WHERE pl.allowed_language IS NULL
GROUP BY p.id, p.slug, p.language_code, pl.project_name, pl.project_slug;

-- 6. Check for multiple home pages per project/language
SELECT 
  '=== MULTIPLE HOME PAGES ===' as section,
  proj.slug as project_slug,
  p.language_code,
  COUNT(*) as home_page_count,
  array_agg(
    json_build_object(
      'id', p.id,
      'slug', p.slug,
      'title', p.title,
      'is_published', p.is_published
    )
  ) as home_pages
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE p.is_home = true
GROUP BY proj.slug, p.language_code
HAVING COUNT(*) > 1;

-- 7. Check for inconsistent full_path values
SELECT 
  '=== INCONSISTENT PATHS ===' as section,
  p.id,
  p.slug,
  p.full_path as current_path,
  CASE 
    WHEN p.parent_id IS NULL THEN '/' || p.slug
    ELSE parent.full_path || '/' || p.slug
  END as expected_path,
  CASE 
    WHEN p.full_path != CASE 
      WHEN p.parent_id IS NULL THEN '/' || p.slug
      ELSE parent.full_path || '/' || p.slug
    END THEN 'Path mismatch'
    ELSE 'OK'
  END as status
FROM content_pages p
LEFT JOIN content_pages parent ON p.parent_id = parent.id
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
AND p.full_path != CASE 
  WHEN p.parent_id IS NULL THEN '/' || p.slug
  ELSE parent.full_path || '/' || p.slug
END;

-- 8. Transaction check - see if there are any long-running transactions that might bypass constraints
SELECT 
  '=== ACTIVE TRANSACTIONS ===' as section,
  pid,
  usename,
  application_name,
  state,
  query_start,
  state_change,
  age(clock_timestamp(), query_start) as query_duration,
  query
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;
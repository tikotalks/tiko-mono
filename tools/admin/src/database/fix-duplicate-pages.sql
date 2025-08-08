-- Fix duplicate pages in the marketing project
-- This script provides safe commands to remove duplicates while preserving the most important page

-- IMPORTANT: Run the check queries first to understand what will be deleted!

BEGIN; -- Start transaction for safety

-- 1. Create a backup table of pages that will be deleted
CREATE TEMP TABLE duplicate_pages_backup AS
WITH marketing_project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
),
pages_with_priority AS (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.slug, p.language_code ORDER BY 
      p.is_published DESC,      -- Keep published pages
      p.updated_at DESC,        -- Keep most recently updated
      (SELECT COUNT(*) FROM content_page_sections WHERE page_id = p.id) DESC,  -- Keep pages with more content
      p.created_at ASC          -- Keep oldest (original)
    ) as keep_priority
  FROM content_pages p
  JOIN marketing_project mp ON p.project_id = mp.id
)
SELECT * FROM pages_with_priority WHERE keep_priority > 1;

-- 2. Show what will be deleted
SELECT 
  'TO BE DELETED:' as action,
  id,
  slug,
  language_code,
  title,
  is_published,
  updated_at,
  (SELECT COUNT(*) FROM content_page_sections WHERE page_id = duplicate_pages_backup.id) as section_count,
  (SELECT COUNT(*) FROM content_field_values WHERE page_id = duplicate_pages_backup.id) as field_value_count
FROM duplicate_pages_backup
ORDER BY slug, language_code;

-- 3. Show what will be kept
WITH marketing_project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
),
pages_to_keep AS (
  SELECT 
    p.*,
    ROW_NUMBER() OVER (PARTITION BY p.slug, p.language_code ORDER BY 
      p.is_published DESC,
      p.updated_at DESC,
      (SELECT COUNT(*) FROM content_page_sections WHERE page_id = p.id) DESC,
      p.created_at ASC
    ) as keep_priority
  FROM content_pages p
  JOIN marketing_project mp ON p.project_id = mp.id
)
SELECT 
  'TO BE KEPT:' as action,
  id,
  slug,
  language_code,
  title,
  is_published,
  updated_at,
  (SELECT COUNT(*) FROM content_page_sections WHERE page_id = pages_to_keep.id) as section_count,
  (SELECT COUNT(*) FROM content_field_values WHERE page_id = pages_to_keep.id) as field_value_count
FROM pages_to_keep
WHERE keep_priority = 1
AND EXISTS (
  SELECT 1 FROM pages_to_keep p2 
  WHERE p2.slug = pages_to_keep.slug 
  AND p2.language_code = pages_to_keep.language_code
  AND p2.keep_priority > 1
)
ORDER BY slug, language_code;

-- 4. Optional: Merge content from duplicates before deletion
-- This section attempts to preserve content from duplicates that might be missing in the kept page
DO $$
DECLARE
  dup_record RECORD;
  kept_page_id UUID;
BEGIN
  FOR dup_record IN 
    SELECT * FROM duplicate_pages_backup
  LOOP
    -- Find the page we're keeping
    SELECT id INTO kept_page_id
    FROM content_pages
    WHERE slug = dup_record.slug 
    AND language_code = dup_record.language_code
    AND project_id = dup_record.project_id
    AND id != dup_record.id
    ORDER BY is_published DESC, updated_at DESC
    LIMIT 1;
    
    -- Log what we're doing
    RAISE NOTICE 'Processing duplicate: % (%) -> keeping %', 
      dup_record.slug, dup_record.language_code, kept_page_id;
    
    -- Copy any unique sections from duplicate to kept page
    INSERT INTO content_page_sections (page_id, section_template_id, order_index, override_name)
    SELECT 
      kept_page_id,
      section_template_id,
      order_index + 1000, -- Offset to avoid conflicts, can be reordered later
      override_name
    FROM content_page_sections
    WHERE page_id = dup_record.id
    AND section_template_id NOT IN (
      SELECT section_template_id 
      FROM content_page_sections 
      WHERE page_id = kept_page_id
    )
    ON CONFLICT DO NOTHING;
    
    -- Copy any unique field values
    INSERT INTO content_field_values (page_id, section_template_id, field_id, language_code, value)
    SELECT 
      kept_page_id,
      section_template_id,
      field_id,
      language_code,
      value
    FROM content_field_values
    WHERE page_id = dup_record.id
    AND NOT EXISTS (
      SELECT 1 
      FROM content_field_values fv
      WHERE fv.page_id = kept_page_id
      AND fv.field_id = content_field_values.field_id
      AND COALESCE(fv.section_template_id, '00000000-0000-0000-0000-000000000000') = 
          COALESCE(content_field_values.section_template_id, '00000000-0000-0000-0000-000000000000')
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 5. Delete the duplicates
DELETE FROM content_pages
WHERE id IN (SELECT id FROM duplicate_pages_backup);

-- 6. Verify the fix
SELECT 
  'AFTER FIX - Remaining duplicates:' as status,
  slug,
  language_code,
  COUNT(*) as count
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
GROUP BY slug, language_code
HAVING COUNT(*) > 1;

-- 7. Show final page count
SELECT 
  'FINAL STATUS:' as status,
  COUNT(*) as total_pages,
  COUNT(DISTINCT slug || '-' || language_code) as unique_combinations,
  COUNT(*) - COUNT(DISTINCT slug || '-' || language_code) as duplicates_removed
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing';

-- ROLLBACK; -- Uncomment to undo changes
-- COMMIT;   -- Uncomment to apply changes

-- To apply the fix:
-- 1. Run this entire script with ROLLBACK at the end to preview
-- 2. Review the output carefully
-- 3. If satisfied, change ROLLBACK to COMMIT and run again
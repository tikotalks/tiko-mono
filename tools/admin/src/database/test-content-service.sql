-- Test the exact query that content service makes for the Intro section
-- This matches what getSectionData() does with language_code=null

-- 1. Test exact query for Intro section with null language_code
SELECT 
    section_id,
    field_key,
    value,
    language_code
FROM content_section_data
WHERE section_id = '2be87ea5-20b6-4d35-a4ac-90b2724db534'
  AND language_code IS NULL
ORDER BY field_key;

-- 2. Show ALL data for Intro section (any language)
SELECT 
    section_id,
    field_key,
    value,
    language_code,
    CASE 
        WHEN language_code IS NULL THEN 'global'
        ELSE language_code
    END as lang_display
FROM content_section_data
WHERE section_id = '2be87ea5-20b6-4d35-a4ac-90b2724db534'
ORDER BY field_key, language_code;

-- 3. Test what PostgREST would return with different query formats
-- Using =is.null (correct)
SELECT 'Query: section_id=eq.XXX&language_code=is.null' as query_format;
SELECT * FROM content_section_data 
WHERE section_id = '2be87ea5-20b6-4d35-a4ac-90b2724db534' 
  AND language_code IS NULL;

-- Using =eq.null (incorrect - returns nothing)
SELECT 'Query: section_id=eq.XXX&language_code=eq.null' as query_format;
SELECT * FROM content_section_data 
WHERE section_id = '2be87ea5-20b6-4d35-a4ac-90b2724db534' 
  AND language_code = NULL;  -- This never matches NULL values!
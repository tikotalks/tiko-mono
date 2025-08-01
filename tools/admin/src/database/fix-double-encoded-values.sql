-- Fix double-encoded JSON values in content_section_data
-- This will clean up values like "\"Apps Content\"" to just "Apps Content"

UPDATE content_section_data
SET value = 
  CASE 
    -- If it's a double-encoded string, unwrap it
    WHEN value::text LIKE '"\"%\""' THEN 
      trim(both '"' from (value #>> '{}'))::jsonb
    -- If it's already properly encoded, leave it
    ELSE 
      value
  END
WHERE value::text LIKE '"\"%\""';

-- Check the results
SELECT 
    s.name as section_name,
    sd.field_key,
    sd.value,
    sd.value #>> '{}' as extracted_value
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
WHERE s.name = 'Apps'
ORDER BY sd.field_key;
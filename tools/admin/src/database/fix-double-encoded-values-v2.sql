-- Fix double-encoded JSON values in content_section_data
-- This handles cases like "\"Apps Content\"" and "\"\\\"Apps Content\\\"\""

-- First, let's see what we're dealing with
SELECT 
    s.name as section_name,
    sd.field_key,
    sd.value::text as raw_value,
    CASE 
        -- Triple encoded: "\"\\\"Apps Content\\\"\""
        WHEN sd.value::text LIKE '"%\\%\\%\\%"' THEN
            trim(both '"' from (sd.value #>> '{}'))::jsonb #>> '{}'
        -- Double encoded: "\"Apps Content\""
        WHEN sd.value::text LIKE '"%"' AND NOT (sd.value::text LIKE '{%' OR sd.value::text LIKE '[%') THEN
            sd.value #>> '{}'
        -- Already proper
        ELSE 
            sd.value::text
    END as cleaned_value
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
WHERE s.name = 'Apps';

-- Now update the values
UPDATE content_section_data sd
SET value = 
    CASE 
        -- Triple encoded: "\"\\\"Apps Content\\\"\""
        WHEN sd.value::text LIKE '"%\\%\\%\\%"' THEN
            to_jsonb(trim(both '"' from (sd.value #>> '{}'))::jsonb #>> '{}')
        -- Double encoded: "\"Apps Content\""
        WHEN sd.value::text LIKE '"%"' AND NOT (sd.value::text LIKE '{%' OR sd.value::text LIKE '[%') THEN
            to_jsonb(sd.value #>> '{}')
        -- Already proper
        ELSE 
            sd.value
    END
FROM content_sections s
WHERE s.id = sd.section_id 
AND s.name = 'Apps'
AND (sd.value::text LIKE '"%\\%\\%\\%"' OR (sd.value::text LIKE '"%"' AND NOT (sd.value::text LIKE '{%' OR sd.value::text LIKE '[%')));

-- Verify the fix
SELECT 
    s.name as section_name,
    sd.field_key,
    sd.value,
    sd.value #>> '{}' as extracted_value
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
WHERE s.name = 'Apps'
ORDER BY sd.field_key;
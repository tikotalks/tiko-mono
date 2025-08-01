-- Check what section instances exist
SELECT id, name, section_template_id FROM content_sections ORDER BY name;

-- Fix the NULL section_ids by matching on name
-- This assumes section instances exist with these names

-- Fix About section
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'About' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'About'
AND section_id IS NULL;

-- Fix Apps section
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'Apps' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Apps'
AND section_id IS NULL;

-- Fix Market Hero section
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'Market Hero' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Market Hero'
AND section_id IS NULL;

-- Fix Marketing Intro section
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'Marketing Intro' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Marketing Intro'
AND section_id IS NULL;

-- Verify the fix
SELECT 
    ps.override_name,
    ps.section_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN 'NO INSTANCE'
        ELSE 'OK'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;
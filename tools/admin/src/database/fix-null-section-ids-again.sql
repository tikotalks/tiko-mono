-- Fix NULL section_ids AGAIN after they were lost when adding new section
-- This time we'll fix ALL of them including the new "Funding" section

-- Check what section instances exist
SELECT id, name, section_template_id FROM content_sections ORDER BY name;

-- Check current state of page sections
SELECT 
    ps.override_name,
    ps.section_id,
    ps.section_template_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN 'NO INSTANCE - NEEDS FIX'
        ELSE 'OK'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- Fix About section (order_index 0)
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

-- Fix Apps section (order_index 1)
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

-- Fix Market Hero section (order_index 2)
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

-- Fix Marketing Intro section (order_index 3)
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

-- Fix Funding section (order_index 4) - this is the new one
-- We need to check if there's a "Funding" section instance, if not we might need to create one
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'Funding' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Funding'
AND section_id IS NULL;

-- If no "Funding" section instance exists, we need to create one
-- Let's check if the above update worked
SELECT 
    ps.override_name,
    ps.section_id,
    ps.section_template_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN 'STILL NULL - NEED TO CREATE INSTANCE'
        ELSE 'FIXED'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- If "Funding" is still null, create the section instance
-- (This will only work if there's no existing Funding section)
INSERT INTO content_sections (
    section_template_id,
    name,
    slug,
    description,
    language_code,
    component_type,
    is_reusable,
    is_active,
    project_id
)
SELECT 
    ps.section_template_id,
    'Funding',
    'funding',
    'Funding information section',
    null,
    'text', -- Assuming this is the component type, adjust if needed
    true,
    true,
    null
FROM content_page_sections ps
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'Funding'
AND ps.section_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM content_sections WHERE name = 'Funding'
)
LIMIT 1;

-- Now fix the Funding section again after creating the instance
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'Funding' 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Funding'
AND section_id IS NULL;

-- Final verification
SELECT 
    ps.override_name,
    ps.section_id,
    ps.section_template_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN '❌ STILL NULL'
        ELSE '✅ FIXED'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;
-- Find all section instances and their templates
SELECT 
    s.id as section_instance_id,
    s.name as section_name,
    s.section_template_id,
    st.name as template_name
FROM content_sections s
JOIN content_section_templates st ON s.section_template_id = st.id
ORDER BY s.name;

-- Find what's in page_sections
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    st.name as template_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Manual fix based on template matching
-- Fix Marketing Intro
UPDATE content_page_sections
SET section_id = 'c9e95eb5-aee8-4759-924f-4a3ed0a37d67'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Marketing Intro';

-- Fix Market Hero  
UPDATE content_page_sections
SET section_id = 'ad671d31-87a8-4558-8362-caa41b9da1b0'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Market Hero';

-- Fix Apps
UPDATE content_page_sections
SET section_id = '944499b5-3613-4816-a6af-1f8a195a8b5a'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'Apps';

-- Verify all are fixed
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    st.name as template_name,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN 'NO SECTION INSTANCE'
        WHEN ps.section_id = ps.section_template_id THEN 'WRONG - USING TEMPLATE ID'
        ELSE 'OK'
    END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
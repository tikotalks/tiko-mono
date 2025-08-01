-- Fix section instance references
-- The issue: section_id is set to section_template_id instead of actual section instance ID

-- First, let's see the current state
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    p.title as page_title,
    st.name as template_name,
    s.name as section_instance_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home';

-- Find the correct section instances that match the templates
WITH section_mappings AS (
    SELECT 
        s.id as correct_section_id,
        s.section_template_id,
        s.name,
        ps.page_id,
        ps.override_name
    FROM content_page_sections ps
    JOIN content_sections s ON s.section_template_id = ps.section_template_id
    WHERE ps.page_id = (SELECT id FROM content_pages WHERE slug = 'home')
    AND ps.section_id = ps.section_template_id -- This is the bug
)
SELECT * FROM section_mappings;

-- Fix: Update page_sections to use the correct section instance IDs
-- For Marketing Intro
UPDATE content_page_sections ps
SET section_id = s.id
FROM content_sections s
WHERE ps.page_id = (SELECT id FROM content_pages WHERE slug = 'home')
AND ps.override_name = 'Marketing Intro'
AND s.section_template_id = ps.section_template_id
AND s.name LIKE '%Intro%';

-- For Market Hero
UPDATE content_page_sections ps
SET section_id = s.id
FROM content_sections s
WHERE ps.page_id = (SELECT id FROM content_pages WHERE slug = 'home')
AND ps.override_name = 'Market Hero'
AND s.section_template_id = ps.section_template_id
AND s.name LIKE '%Hero%';

-- For Apps
UPDATE content_page_sections ps
SET section_id = s.id
FROM content_sections s
WHERE ps.page_id = (SELECT id FROM content_pages WHERE slug = 'home')
AND ps.override_name = 'Apps'
AND s.section_template_id = ps.section_template_id
AND s.name = 'Apps';

-- Verify the fix
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    st.name as template_name,
    s.name as section_instance_name,
    CASE WHEN ps.section_id = ps.section_template_id THEN 'BUG: Same ID!' ELSE 'OK' END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
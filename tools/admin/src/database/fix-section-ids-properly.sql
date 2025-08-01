-- Fix section IDs to point to actual section instances instead of templates

-- First, let's see what we need to fix
SELECT 
    ps.page_id,
    p.title as page_title,
    ps.section_template_id,
    ps.section_id as current_section_id,
    ps.override_name,
    s.id as correct_section_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id = ps.section_template_id THEN 'NEEDS FIX'
        ELSE 'OK'
    END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON s.name = ps.override_name
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Now fix the section IDs by matching on override_name
UPDATE content_page_sections ps
SET section_id = s.id
FROM content_sections s
WHERE ps.page_id = (SELECT id FROM content_pages WHERE slug = 'home')
AND ps.override_name = s.name
AND ps.section_id = ps.section_template_id; -- Only fix where section_id equals template_id

-- Verify the fix
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    st.name as template_name,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id = ps.section_template_id THEN 'STILL BROKEN!'
        ELSE 'FIXED'
    END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
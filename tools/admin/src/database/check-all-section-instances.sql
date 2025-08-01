-- Check ALL section instances
SELECT 
    s.id,
    s.name,
    s.section_template_id,
    st.name as template_name
FROM content_sections s
LEFT JOIN content_section_templates st ON s.section_template_id = st.id
ORDER BY s.created_at DESC;

-- Check what's on pages
SELECT 
    ps.page_id,
    ps.section_id,
    ps.section_template_id,
    ps.override_name,
    p.title as page_title,
    s.name as section_instance_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
ORDER BY p.created_at DESC;
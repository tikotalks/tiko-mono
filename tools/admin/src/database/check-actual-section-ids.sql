-- Check the actual section instance IDs vs what's in page_sections
SELECT 
    s.id as actual_section_id,
    s.name as section_name,
    s.section_template_id,
    st.name as template_name
FROM content_sections s
JOIN content_section_templates st ON s.section_template_id = st.id
ORDER BY s.created_at DESC;

-- Check what's currently in page_sections
SELECT 
    ps.section_id as current_section_id,
    ps.section_template_id,
    ps.override_name,
    p.slug as page_slug
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- See if section_data exists
SELECT 
    sd.section_id,
    s.name as section_name,
    COUNT(*) as field_count
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
GROUP BY sd.section_id, s.name;
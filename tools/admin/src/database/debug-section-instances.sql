-- Debug section instances and their relationships
-- Check what section instances exist
SELECT 
    s.id as section_id,
    s.name,
    s.section_template_id,
    st.name as template_name,
    st.id as template_id
FROM content_sections s
LEFT JOIN content_section_templates st ON s.section_template_id = st.id
ORDER BY s.created_at DESC;

-- Check what's in page_sections
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    p.title as page_title,
    st.name as template_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Check if section_data exists for these sections
SELECT 
    sd.section_id,
    sd.field_key,
    sd.value,
    s.name as section_name
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
ORDER BY s.name, sd.field_key;
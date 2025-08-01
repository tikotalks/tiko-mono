-- Check what's in page_sections for the home page
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.order_index,
    ps.override_name,
    st.name as template_name,
    s.name as section_instance_name
FROM content_page_sections ps
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- Also check what section instances exist
SELECT 
    s.id as section_id,
    s.name,
    s.section_template_id,
    st.name as template_name
FROM content_sections s
JOIN content_section_templates st ON s.section_template_id = st.id
WHERE s.name LIKE '%App%';
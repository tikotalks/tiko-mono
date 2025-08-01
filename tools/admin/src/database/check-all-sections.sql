-- Check all sections on the home page
SELECT 
    ps.override_name,
    ps.section_template_id,
    ps.section_id,
    ps.order_index,
    s.name as section_name,
    st.name as template_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Check if there's a Marketing Intro section instance
SELECT 
    s.id,
    s.name,
    s.section_template_id,
    st.name as template_name
FROM content_sections s
LEFT JOIN content_section_templates st ON s.section_template_id = st.id
WHERE s.name LIKE '%Intro%';
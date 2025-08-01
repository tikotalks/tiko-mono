-- Simple fix: Link sections based on their template IDs
-- This assumes you have one section instance per template

-- For each page section that needs fixing, find the matching section instance
UPDATE content_page_sections ps
SET section_id = s.id
FROM content_sections s
WHERE ps.section_template_id = s.section_template_id
AND ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND (ps.section_id IS NULL OR ps.section_id = ps.section_template_id);

-- Verify the results
SELECT 
    ps.override_name,
    ps.section_template_id,
    ps.section_id,
    s.name as section_name,
    st.name as template_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
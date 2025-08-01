-- Fix the Marketing Intro section link
UPDATE content_page_sections ps
SET section_id = 'c9e95eb5-aee8-4759-924f-4a3ed0a37d67'
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.section_template_id = 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0'
AND ps.override_name = 'Marketing Intro';

-- Verify all sections are now properly linked
SELECT 
    ps.override_name,
    ps.section_template_id,
    ps.section_id,
    ps.order_index,
    s.name as section_name,
    st.name as template_name,
    CASE 
        WHEN ps.section_id IS NULL THEN 'NO SECTION'
        WHEN ps.section_id = ps.section_template_id THEN 'WRONG ID'
        ELSE 'OK'
    END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
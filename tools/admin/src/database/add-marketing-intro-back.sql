-- First check if Marketing Intro is already on the page (might be hidden)
SELECT * FROM content_page_sections 
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND section_template_id = 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0';

-- If not found, add Marketing Intro back to the page
INSERT INTO content_page_sections (
    page_id,
    section_template_id,
    section_id,
    order_index,
    override_name
) VALUES (
    '6b8793ed-ced1-4cbf-9447-185250e562d5',  -- home page
    'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0',  -- Intro Template
    'c9e95eb5-aee8-4759-924f-4a3ed0a37d67',  -- Marketing Intro instance
    0,  -- first position
    'Marketing Intro'
) ON CONFLICT DO NOTHING;

-- Shift other sections down if needed
UPDATE content_page_sections 
SET order_index = order_index + 1
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND order_index >= 0
AND section_template_id != 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0';

-- Verify all sections are now on the page
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
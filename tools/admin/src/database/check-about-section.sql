-- Check what's on the home page
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    ps.order_index,
    p.slug as page_slug
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Check if there's an About section instance
SELECT * FROM content_sections WHERE name = 'About';

-- Or any section instance for the template
SELECT * FROM content_sections 
WHERE section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b';
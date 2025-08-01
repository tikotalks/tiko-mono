-- Check ALL sections on the home page
SELECT 
    ps.id,
    ps.page_id,
    ps.section_id,
    ps.section_template_id,
    ps.order_index,
    ps.override_name,
    s.name as section_name,
    p.slug as page_slug
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Count how many sections are on the home page
SELECT COUNT(*) as section_count
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
WHERE p.slug = 'home';
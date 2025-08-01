-- Check what sections are on the home page
SELECT 
    ps.*,
    p.slug as page_slug,
    s.name as section_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
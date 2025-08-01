-- Debug what's happening with sections loading

-- 1. Check page sections
SELECT 
    ps.page_id,
    ps.section_id,
    ps.section_template_id,
    ps.override_name,
    p.slug as page_slug
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- 2. Check if section instances exist with those IDs
SELECT 
    id,
    name,
    section_template_id,
    is_active
FROM content_sections
WHERE id IN (
    'c9e95eb5-aee8-4759-924f-4a3ed0a37d67',
    '944499b5-3613-4816-a6af-1f8a195a8b5a', 
    'ad671d31-87a8-4558-8362-caa41b9da1b0'
);

-- 3. Try querying sections like the API would
SELECT * FROM content_sections 
WHERE id = 'c9e95eb5-aee8-4759-924f-4a3ed0a37d67';
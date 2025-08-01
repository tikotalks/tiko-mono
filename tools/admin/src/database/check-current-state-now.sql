-- Check what's REALLY in the database right now
SELECT 
    ps.page_id,
    ps.section_template_id,
    ps.section_id,
    ps.override_name,
    ps.order_index,
    p.slug as page_slug,
    CASE 
        WHEN ps.section_id = ps.section_template_id THEN 'WRONG - Same as template!'
        WHEN ps.section_id IS NULL THEN 'NULL'
        ELSE 'OK - Different IDs'
    END as status
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;

-- Also check if we have the correct section instance IDs
SELECT 
    id as section_instance_id,
    name,
    section_template_id
FROM content_sections
ORDER BY name;
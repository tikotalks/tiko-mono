-- DEFINITIVE FIX: Update section_id to point to actual section instances

-- Update Marketing Intro
UPDATE content_page_sections
SET section_id = 'c9e95eb5-aee8-4759-924f-4a3ed0a37d67'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND section_template_id = 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0'
AND order_index = 0;

-- Update Apps
UPDATE content_page_sections
SET section_id = '944499b5-3613-4816-a6af-1f8a195a8b5a'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b'
AND order_index = 1;

-- Update Market Hero
UPDATE content_page_sections
SET section_id = 'ad671d31-87a8-4558-8362-caa41b9da1b0'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND section_template_id = 'e6f30596-1f25-4deb-b067-b5f8902a996b'
AND order_index = 2;

-- VERIFY the updates worked
SELECT 
    ps.override_name,
    ps.section_template_id,
    ps.section_id,
    ps.order_index,
    CASE 
        WHEN ps.section_id = ps.section_template_id THEN '❌ STILL WRONG!'
        WHEN ps.section_id IS NULL THEN '❌ NULL'
        ELSE '✅ FIXED'
    END as status,
    s.name as section_instance_name
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE p.slug = 'home'
ORDER BY ps.order_index;
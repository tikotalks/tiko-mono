-- First, check if an "About" section instance exists
SELECT * FROM content_sections WHERE name = 'About';

-- If not, create one
INSERT INTO content_sections (
    id,
    section_template_id,
    name,
    slug,
    component_type,
    is_active,
    is_reusable
) VALUES (
    gen_random_uuid(),
    '4c00d507-81a5-41a7-b09e-13c86a1a911b', -- Content Template
    'About',
    'about',
    'text', -- Required field
    true,
    true
) ON CONFLICT DO NOTHING;

-- Get the ID of the About section instance
SELECT id FROM content_sections WHERE name = 'About';

-- Update the page section to link to this instance
-- Use the most recently created About section
UPDATE content_page_sections
SET section_id = (
    SELECT id FROM content_sections 
    WHERE name = 'About' 
    AND section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b'
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND override_name = 'About';

-- Verify it worked
SELECT 
    ps.override_name,
    ps.section_id,
    s.name as section_instance_name
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5';
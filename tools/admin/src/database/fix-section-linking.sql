-- Fix the Apps section on the home page to link to the section instance

-- First, let's verify what we're updating
SELECT 
    ps.*,
    s.id as correct_section_id,
    s.name as section_name
FROM content_page_sections ps
LEFT JOIN content_sections s ON s.section_template_id = ps.section_template_id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b'
AND s.name = 'Apps';

-- Update the page section to link to the Apps section instance
UPDATE content_page_sections
SET section_id = '011706a1-f44e-47b2-8ae0-f8a4508e31d7'
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b'
AND section_id IS NULL;

-- Verify the update
SELECT 
    ps.*,
    s.name as section_name
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;
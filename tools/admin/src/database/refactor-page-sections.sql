-- Refactor content_page_sections to remove redundant section_template_id
-- Since section instances already know their template, we don't need to store it twice

-- First, ensure all page sections have valid section_id references
SELECT 
    ps.page_id,
    ps.section_id,
    ps.section_template_id,
    ps.override_name,
    s.name as section_name,
    s.section_template_id as section_knows_template
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.section_id IS NOT NULL;

-- Drop the redundant column (after confirming all data is properly linked)
-- ALTER TABLE content_page_sections DROP COLUMN section_template_id;

-- Update the unique constraint to only include page_id and section_id
-- ALTER TABLE content_page_sections DROP CONSTRAINT IF EXISTS unique_page_section_template;
-- ALTER TABLE content_page_sections ADD CONSTRAINT unique_page_section UNIQUE (page_id, section_id);

-- Final structure check
-- \d content_page_sections
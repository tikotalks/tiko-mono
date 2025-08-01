-- Add CASCADE DELETE to content_page_sections foreign key for section_id
-- This will automatically remove page-section links when a section is deleted

-- First, drop the existing foreign key constraint
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS content_page_sections_section_id_fkey;

-- Re-add the foreign key with CASCADE DELETE
ALTER TABLE content_page_sections 
ADD CONSTRAINT content_page_sections_section_id_fkey 
FOREIGN KEY (section_id) 
REFERENCES content_sections(id) 
ON DELETE CASCADE;

-- Also update the section_template_id foreign key to cascade (for consistency)
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS content_page_sections_section_template_id_fkey;

ALTER TABLE content_page_sections 
ADD CONSTRAINT content_page_sections_section_template_id_fkey 
FOREIGN KEY (section_template_id) 
REFERENCES content_section_templates(id) 
ON DELETE CASCADE;

-- Verify the constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    confdeltype AS delete_action
FROM pg_constraint 
WHERE conrelid = 'content_page_sections'::regclass
AND contype = 'f';
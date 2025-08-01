-- Add CASCADE DELETE to section references
-- This ensures that when a section is deleted, it's automatically removed from all pages

-- First, drop the existing constraint
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS content_page_sections_section_id_fkey;

-- Add it back with CASCADE DELETE
ALTER TABLE content_page_sections 
ADD CONSTRAINT content_page_sections_section_id_fkey 
FOREIGN KEY (section_id) 
REFERENCES content_sections(id) 
ON DELETE CASCADE;

-- Verify the constraint
SELECT 
    conname as constraint_name,
    confdeltype,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END as delete_action
FROM pg_constraint
WHERE conname = 'content_page_sections_section_id_fkey';
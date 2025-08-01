-- Alter content_page_sections to support section instances
-- This adds a section_id column to reference content_sections table

-- Add column to reference section instances
ALTER TABLE content_page_sections 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES content_sections(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_page_sections_section_id 
ON content_page_sections(section_id);

-- Update the unique constraint to allow multiple instances of the same template
-- First drop the old constraint
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS unique_page_section_template;

-- Add new constraint that allows same template multiple times with different section instances
ALTER TABLE content_page_sections 
ADD CONSTRAINT unique_page_section_instance 
UNIQUE (page_id, section_id);

-- Note: section_template_id is still kept for backward compatibility
-- and for cases where you add a template directly without an instance
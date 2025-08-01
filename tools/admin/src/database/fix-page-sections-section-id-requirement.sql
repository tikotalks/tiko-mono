-- Fix content_page_sections to work with section instances
-- This makes section_template_id optional since we now use section_id

-- First, make section_template_id nullable
ALTER TABLE content_page_sections 
ALTER COLUMN section_template_id DROP NOT NULL;

-- Make section_id required instead (if it isn't already)
ALTER TABLE content_page_sections 
ALTER COLUMN section_id SET NOT NULL;

-- Drop the old primary key that was based on page_id + section_template_id
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS content_page_sections_pkey;

-- Create new primary key based on page_id + section_id
ALTER TABLE content_page_sections 
ADD CONSTRAINT content_page_sections_pkey 
PRIMARY KEY (page_id, section_id);

-- Optional: Add a check constraint to ensure we have either section_id or section_template_id
-- (This allows backward compatibility while encouraging the new approach)
ALTER TABLE content_page_sections
ADD CONSTRAINT check_section_reference 
CHECK (section_id IS NOT NULL OR section_template_id IS NOT NULL);

-- Add comment to clarify the columns
COMMENT ON COLUMN content_page_sections.section_template_id IS 'DEPRECATED - Use section_id instead. Only kept for backward compatibility.';
COMMENT ON COLUMN content_page_sections.section_id IS 'Reference to the content_sections instance';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'content_page_sections'
ORDER BY ordinal_position;
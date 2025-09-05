-- Add 'label' type to the content_navigation_items type constraint
-- This allows navigation items to be label-only (no link)

BEGIN;

-- First, let's check what the current constraint looks like
-- (This is just for reference, the constraint name might be different)

-- Drop the existing type constraint
ALTER TABLE content_navigation_items 
DROP CONSTRAINT IF EXISTS content_navigation_items_type_check;

-- Add the new constraint that includes 'label'
ALTER TABLE content_navigation_items 
ADD CONSTRAINT content_navigation_items_type_check 
CHECK (type IN ('label', 'page', 'custom', 'external'));

COMMIT;

-- Verify the constraint was added correctly
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'content_navigation_items'::regclass 
  AND contype = 'c';
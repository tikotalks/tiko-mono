-- Rollback migration: Revert show_in_navigation column back to BOOLEAN
-- Only run this if you need to undo the changes from 20250205_update_show_in_navigation_column.sql

BEGIN;

-- Create a temporary boolean column
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation_bool BOOLEAN;

-- Convert text values back to boolean
UPDATE content_pages
SET show_in_navigation_bool = CASE 
    WHEN show_in_navigation IN ('true', 'desktop', 'mobile') THEN true
    WHEN show_in_navigation = 'false' THEN false
    ELSE true -- Default to true for any unexpected values
END;

-- Drop the constraint
ALTER TABLE content_pages
DROP CONSTRAINT IF EXISTS check_show_in_navigation;

-- Drop the text column
ALTER TABLE content_pages
DROP COLUMN IF EXISTS show_in_navigation;

-- Rename the boolean column back
ALTER TABLE content_pages
RENAME COLUMN show_in_navigation_bool TO show_in_navigation;

-- Set NOT NULL and default value
ALTER TABLE content_pages
ALTER COLUMN show_in_navigation SET NOT NULL,
ALTER COLUMN show_in_navigation SET DEFAULT true;

-- Recreate the original index
DROP INDEX IF EXISTS idx_content_pages_navigation;
CREATE INDEX idx_content_pages_navigation 
ON content_pages(project_id, language_code, show_in_navigation, navigation_order)
WHERE is_published = true;

-- Update the column comment
COMMENT ON COLUMN content_pages.show_in_navigation IS 'Whether this page should appear in navigation menus';

COMMIT;
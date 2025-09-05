-- Update show_in_navigation column to support more granular control
-- Changes from BOOLEAN to TEXT with allowed values: 'false', 'mobile', 'desktop', 'true'

BEGIN;

-- First, create a temporary column to hold the new values
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation_new TEXT;

-- Migrate existing boolean values to text
UPDATE content_pages
SET show_in_navigation_new = CASE 
    WHEN show_in_navigation = true THEN 'true'
    WHEN show_in_navigation = false THEN 'false'
    ELSE 'true' -- Default for any NULL values
END;

-- Drop the old column
ALTER TABLE content_pages
DROP COLUMN IF EXISTS show_in_navigation;

-- Rename the new column to the original name
ALTER TABLE content_pages
RENAME COLUMN show_in_navigation_new TO show_in_navigation;

-- Add CHECK constraint to ensure only allowed values
ALTER TABLE content_pages
ADD CONSTRAINT check_show_in_navigation 
CHECK (show_in_navigation IN ('false', 'mobile', 'desktop', 'true'));

-- Set NOT NULL and default value
ALTER TABLE content_pages
ALTER COLUMN show_in_navigation SET NOT NULL,
ALTER COLUMN show_in_navigation SET DEFAULT 'true';

-- Update any existing NULL values to 'true'
UPDATE content_pages
SET show_in_navigation = 'true'
WHERE show_in_navigation IS NULL;

-- Recreate the index with the updated column
DROP INDEX IF EXISTS idx_content_pages_navigation;
CREATE INDEX idx_content_pages_navigation 
ON content_pages(project_id, language_code, show_in_navigation, navigation_order)
WHERE is_published = true;

-- Update the column comment
COMMENT ON COLUMN content_pages.show_in_navigation IS 'Navigation visibility: "false" (hidden), "mobile" (mobile only), "desktop" (desktop only), "true" (all devices)';

COMMIT;

-- Verification query
-- SELECT id, title, show_in_navigation FROM content_pages ORDER BY navigation_order;
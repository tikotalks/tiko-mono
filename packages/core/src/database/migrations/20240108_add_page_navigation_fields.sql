-- Add navigation-related fields to content_pages table
BEGIN;

-- Add show_in_navigation column with default true
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT true;

-- Add navigation_order column
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS navigation_order INTEGER;

-- Set initial navigation_order based on created_at for existing pages
UPDATE content_pages
SET navigation_order = subquery.row_num - 1
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) as row_num
  FROM content_pages
) AS subquery
WHERE content_pages.id = subquery.id
AND content_pages.navigation_order IS NULL;

-- Set default 0 for any remaining null values
UPDATE content_pages
SET navigation_order = 0
WHERE navigation_order IS NULL;

-- Now make navigation_order NOT NULL with default 0
ALTER TABLE content_pages
ALTER COLUMN navigation_order SET NOT NULL,
ALTER COLUMN navigation_order SET DEFAULT 0;

-- Create index for faster navigation queries
CREATE INDEX IF NOT EXISTS idx_content_pages_navigation 
ON content_pages(project_id, language_code, show_in_navigation, navigation_order)
WHERE is_published = true;

-- Add comments
COMMENT ON COLUMN content_pages.show_in_navigation IS 'Whether this page should appear in navigation menus';
COMMENT ON COLUMN content_pages.navigation_order IS 'Order of the page in navigation (lower numbers appear first)';

COMMIT;
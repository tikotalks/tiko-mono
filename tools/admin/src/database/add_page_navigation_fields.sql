-- Add navigation-related fields to content_pages table
-- Run this migration to properly store navigation visibility and order

BEGIN;

-- Add show_in_navigation column with default true
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT true;

-- Add navigation_order column
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS navigation_order INTEGER;

-- Migrate existing data from page_data JSON if it exists
UPDATE content_pages
SET 
  show_in_navigation = COALESCE((page_data->>'show_in_navigation')::boolean, true),
  navigation_order = COALESCE((page_data->>'navigation_order')::integer, 0)
WHERE page_data IS NOT NULL;

-- Set initial navigation_order based on created_at for pages without order
UPDATE content_pages
SET navigation_order = subquery.row_num - 1
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) as row_num
  FROM content_pages
  WHERE navigation_order IS NULL
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

-- To verify the migration worked:
-- SELECT id, title, show_in_navigation, navigation_order FROM content_pages ORDER BY navigation_order;
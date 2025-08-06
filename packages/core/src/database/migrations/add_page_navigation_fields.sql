-- Add navigation-related fields to content_pages table
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS navigation_order INTEGER DEFAULT 0;

-- Create index for faster navigation queries
CREATE INDEX IF NOT EXISTS idx_content_pages_navigation 
ON content_pages(project_id, language_code, show_in_navigation, navigation_order)
WHERE is_published = true;

-- Comment on columns
COMMENT ON COLUMN content_pages.show_in_navigation IS 'Whether this page should appear in navigation menus';
COMMENT ON COLUMN content_pages.navigation_order IS 'Order of the page in navigation (lower numbers appear first)';
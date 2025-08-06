-- Add navigation and hierarchy fields to content_pages table
-- This migration adds:
-- 1. Navigation visibility and ordering
-- 2. Parent-child relationships for page hierarchy

BEGIN;

-- Add navigation fields
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS show_in_navigation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS navigation_order INTEGER DEFAULT 0;

-- Add hierarchy fields
ALTER TABLE content_pages
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN content_pages.show_in_navigation IS 'Whether this page should appear in navigation menus';
COMMENT ON COLUMN content_pages.navigation_order IS 'Order of the page in navigation (lower numbers appear first)';
COMMENT ON COLUMN content_pages.parent_id IS 'Parent page ID for hierarchical structure';
COMMENT ON COLUMN content_pages.depth IS 'Depth level in the hierarchy (0 for root pages)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_pages_parent_id ON content_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_pages_navigation 
ON content_pages(project_id, language_code, show_in_navigation, navigation_order)
WHERE is_published = true;

-- Migrate existing data from page_data JSON if it exists
UPDATE content_pages
SET 
  show_in_navigation = COALESCE((page_data->>'show_in_navigation')::boolean, show_in_navigation),
  navigation_order = COALESCE((page_data->>'navigation_order')::integer, navigation_order)
WHERE page_data IS NOT NULL;

-- Function to calculate the full path based on hierarchy
CREATE OR REPLACE FUNCTION update_page_full_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  -- If page has a parent, build path from parent
  IF NEW.parent_id IS NOT NULL THEN
    SELECT full_path INTO parent_path FROM content_pages WHERE id = NEW.parent_id;
    NEW.full_path = parent_path || '/' || NEW.slug;
  ELSE
    -- Root level page
    NEW.full_path = '/' || NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update paths
DROP TRIGGER IF EXISTS update_page_path_trigger ON content_pages;
CREATE TRIGGER update_page_path_trigger
BEFORE INSERT OR UPDATE OF slug, parent_id ON content_pages
FOR EACH ROW
EXECUTE FUNCTION update_page_full_path();

-- Function to update child paths when parent path changes
CREATE OR REPLACE FUNCTION update_child_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- If the path changed, update all children
  IF OLD.full_path IS DISTINCT FROM NEW.full_path THEN
    UPDATE content_pages
    SET full_path = NEW.full_path || substring(full_path from length(OLD.full_path) + 1)
    WHERE parent_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cascade path updates
DROP TRIGGER IF EXISTS update_child_paths_trigger ON content_pages;
CREATE TRIGGER update_child_paths_trigger
AFTER UPDATE OF full_path ON content_pages
FOR EACH ROW
EXECUTE FUNCTION update_child_paths();

-- Function to calculate depth
CREATE OR REPLACE FUNCTION calculate_page_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_depth INTEGER;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth = 0;
  ELSE
    SELECT depth INTO parent_depth FROM content_pages WHERE id = NEW.parent_id;
    NEW.depth = COALESCE(parent_depth, 0) + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate depth
DROP TRIGGER IF EXISTS calculate_depth_trigger ON content_pages;
CREATE TRIGGER calculate_depth_trigger
BEFORE INSERT OR UPDATE OF parent_id ON content_pages
FOR EACH ROW
EXECUTE FUNCTION calculate_page_depth();

-- Update existing pages to ensure paths are correct
UPDATE content_pages SET slug = slug WHERE true;

COMMIT;

-- Verify the migration:
-- SELECT id, title, slug, full_path, parent_id, depth, navigation_order, show_in_navigation 
-- FROM content_pages 
-- ORDER BY navigation_order;
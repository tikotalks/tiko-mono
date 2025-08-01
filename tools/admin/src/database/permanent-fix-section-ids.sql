-- Permanent fix: Create a trigger that prevents NULL section_ids
-- This will automatically fix section_ids whenever they are set to NULL

-- First, fix all current NULL section_ids
UPDATE content_page_sections ps
SET section_id = (
    SELECT s.id 
    FROM content_sections s
    WHERE s.name = ps.override_name
    ORDER BY s.created_at DESC
    LIMIT 1
)
WHERE ps.section_id IS NULL
AND EXISTS (
    SELECT 1 FROM content_sections s2 
    WHERE s2.name = ps.override_name
);

-- Create a function to auto-fix NULL section_ids
CREATE OR REPLACE FUNCTION fix_null_section_ids()
RETURNS TRIGGER AS $$
BEGIN
    -- If section_id is NULL but we have an override_name, try to find matching section
    IF NEW.section_id IS NULL AND NEW.override_name IS NOT NULL THEN
        SELECT id INTO NEW.section_id
        FROM content_sections
        WHERE name = NEW.override_name
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Log if we couldn't find a match
        IF NEW.section_id IS NULL THEN
            RAISE WARNING 'Could not find section instance for override_name: %', NEW.override_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inserts
DROP TRIGGER IF EXISTS fix_section_ids_on_insert ON content_page_sections;
CREATE TRIGGER fix_section_ids_on_insert
BEFORE INSERT ON content_page_sections
FOR EACH ROW
EXECUTE FUNCTION fix_null_section_ids();

-- Create trigger for updates
DROP TRIGGER IF EXISTS fix_section_ids_on_update ON content_page_sections;
CREATE TRIGGER fix_section_ids_on_update
BEFORE UPDATE ON content_page_sections
FOR EACH ROW
WHEN (NEW.section_id IS NULL)
EXECUTE FUNCTION fix_null_section_ids();

-- Verify the fix worked
SELECT 
    ps.override_name,
    ps.section_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN '❌ STILL NULL'
        ELSE '✅ FIXED'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;
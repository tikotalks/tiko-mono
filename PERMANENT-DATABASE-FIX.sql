-- PERMANENT FIX: Create a trigger that ALWAYS ensures section_id is set
-- This will work regardless of what the frontend sends

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS auto_link_section_id ON content_page_sections;
DROP FUNCTION IF EXISTS auto_link_section_id();

-- Create function that automatically links section_id
CREATE OR REPLACE FUNCTION auto_link_section_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If section_id is null, try to find it by override_name
    IF NEW.section_id IS NULL AND NEW.override_name IS NOT NULL THEN
        SELECT id INTO NEW.section_id
        FROM content_sections
        WHERE name = NEW.override_name
        LIMIT 1;
        
        -- If still not found, create a new section instance
        IF NEW.section_id IS NULL AND NEW.section_template_id IS NOT NULL THEN
            INSERT INTO content_sections (
                section_template_id,
                name,
                slug,
                description,
                language_code,
                is_reusable,
                is_active,
                project_id
            ) VALUES (
                NEW.section_template_id,
                NEW.override_name,
                LOWER(REPLACE(NEW.override_name, ' ', '-')),
                NEW.override_name || ' section',
                null,
                true,
                true,
                null
            )
            RETURNING id INTO NEW.section_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT
CREATE TRIGGER auto_link_section_id_insert
    BEFORE INSERT ON content_page_sections
    FOR EACH ROW
    EXECUTE FUNCTION auto_link_section_id();

-- Create trigger on UPDATE
CREATE TRIGGER auto_link_section_id_update
    BEFORE UPDATE ON content_page_sections
    FOR EACH ROW
    WHEN (NEW.section_id IS NULL)
    EXECUTE FUNCTION auto_link_section_id();

-- Test the trigger by updating all records
UPDATE content_page_sections 
SET section_id = section_id 
WHERE page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5';

-- Verify it worked
SELECT 
    ps.override_name,
    ps.section_id,
    CASE 
        WHEN ps.section_id IS NULL THEN '❌ TRIGGER FAILED'
        ELSE '✅ TRIGGER WORKED'
    END as status
FROM content_page_sections ps
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;
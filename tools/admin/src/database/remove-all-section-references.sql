-- Remove all section references to allow deletion of section instances

-- First, see what pages are using section instances
SELECT 
    p.title as page_title,
    s.name as section_name,
    ps.section_id
FROM content_page_sections ps
JOIN content_pages p ON ps.page_id = p.id
JOIN content_sections s ON ps.section_id = s.id
WHERE ps.section_id IS NOT NULL;

-- Remove all section_id references (but keep the sections on pages as template references)
UPDATE content_page_sections
SET section_id = NULL
WHERE section_id IS NOT NULL;

-- Now you can delete section instances from the admin UI
-- Or delete all section instances and their data:
/*
-- Delete all section data
DELETE FROM content_section_data;

-- Delete all section instances
DELETE FROM content_sections;
*/
-- Complete fresh start for sections

-- 1. Remove all page sections
DELETE FROM content_page_sections;

-- 2. Delete all section data
DELETE FROM content_section_data;

-- 3. Delete all section instances
DELETE FROM content_sections;

-- 4. Verify everything is clean
SELECT 'Page Sections:', COUNT(*) FROM content_page_sections
UNION ALL
SELECT 'Section Data:', COUNT(*) FROM content_section_data
UNION ALL
SELECT 'Section Instances:', COUNT(*) FROM content_sections;

-- Note: This keeps your section templates, so you can create new instances from them
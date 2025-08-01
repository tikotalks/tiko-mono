-- Comprehensive fix for section linking issues
-- This fixes the root cause: sections need to be properly linked to section instances

-- Step 1: Check what section instances we have
SELECT id, name, section_template_id, created_at 
FROM content_sections 
ORDER BY name, created_at DESC;

-- Step 2: Check what sections are currently broken (NULL section_id)
SELECT 
    ps.page_id,
    ps.override_name,
    ps.section_id,
    ps.section_template_id,
    ps.order_index
FROM content_page_sections ps
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.section_id IS NULL
ORDER BY ps.order_index;

-- Step 3: For each broken section, try to find or create a section instance
-- This matches by override_name to existing section instances

-- Fix Market Hero
UPDATE content_page_sections ps
SET section_id = COALESCE(
    -- First try to find existing section instance by name
    (SELECT id FROM content_sections WHERE name = 'Market Hero' ORDER BY created_at DESC LIMIT 1),
    -- If not found, we'll need to create one (see below)
    ps.section_id
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'Market Hero'
AND ps.section_id IS NULL;

-- Fix Marketing Intro
UPDATE content_page_sections ps
SET section_id = COALESCE(
    (SELECT id FROM content_sections WHERE name = 'Marketing Intro' ORDER BY created_at DESC LIMIT 1),
    ps.section_id
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'Marketing Intro'
AND ps.section_id IS NULL;

-- Fix About
UPDATE content_page_sections ps
SET section_id = COALESCE(
    (SELECT id FROM content_sections WHERE name = 'About' ORDER BY created_at DESC LIMIT 1),
    ps.section_id
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'About'
AND ps.section_id IS NULL;

-- Fix Funding
UPDATE content_page_sections ps
SET section_id = COALESCE(
    (SELECT id FROM content_sections WHERE name = 'Funding' ORDER BY created_at DESC LIMIT 1),
    ps.section_id
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'Funding'
AND ps.section_id IS NULL;

-- Fix Apps
UPDATE content_page_sections ps
SET section_id = COALESCE(
    (SELECT id FROM content_sections WHERE name = 'Apps' ORDER BY created_at DESC LIMIT 1),
    ps.section_id
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.override_name = 'Apps'
AND ps.section_id IS NULL;

-- Step 4: For any sections still missing instances, create them
-- This creates section instances based on the template ID
INSERT INTO content_sections (
    section_template_id,
    name,
    slug,
    description,
    language_code,
    is_reusable,
    is_active,
    project_id
)
SELECT DISTINCT
    ps.section_template_id,
    ps.override_name as name,
    LOWER(REPLACE(ps.override_name, ' ', '-')) as slug,
    ps.override_name || ' section instance' as description,
    null::text as language_code,
    true as is_reusable,
    true as is_active,
    null::uuid as project_id
FROM content_page_sections ps
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.section_id IS NULL
AND ps.section_template_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM content_sections s 
    WHERE s.name = ps.override_name
);

-- Step 5: Now link the newly created instances
UPDATE content_page_sections ps
SET section_id = (
    SELECT id FROM content_sections s
    WHERE s.name = ps.override_name
    ORDER BY s.created_at DESC
    LIMIT 1
)
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
AND ps.section_id IS NULL;

-- Step 6: Verify all sections now have section_id
SELECT 
    ps.order_index,
    ps.override_name,
    ps.section_id,
    s.name as section_instance_name,
    CASE 
        WHEN ps.section_id IS NULL THEN '❌ STILL BROKEN'
        ELSE '✅ FIXED'
    END as status
FROM content_page_sections ps
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- Step 7: Add some sample content data for the section instances so they display something
-- Add content for Market Hero section
INSERT INTO content_section_data (section_id, field_key, value, language_code)
SELECT 
    s.id,
    'title',
    '"Welcome to Tiko"'::jsonb,
    'en'
FROM content_sections s
WHERE s.name = 'Market Hero'
AND NOT EXISTS (
    SELECT 1 FROM content_section_data sd 
    WHERE sd.section_id = s.id AND sd.field_key = 'title'
);

INSERT INTO content_section_data (section_id, field_key, value, language_code)
SELECT 
    s.id,
    'description',
    '"Educational apps designed for children to learn through play"'::jsonb,
    'en'
FROM content_sections s
WHERE s.name = 'Market Hero'
AND NOT EXISTS (
    SELECT 1 FROM content_section_data sd 
    WHERE sd.section_id = s.id AND sd.field_key = 'description'
);

-- Add content for Marketing Intro section
INSERT INTO content_section_data (section_id, field_key, value, language_code)
SELECT 
    s.id,
    'content',
    '"Tiko provides a suite of educational apps that make learning fun and engaging for children."'::jsonb,
    'en'
FROM content_sections s
WHERE s.name = 'Marketing Intro'
AND NOT EXISTS (
    SELECT 1 FROM content_section_data sd 
    WHERE sd.section_id = s.id AND sd.field_key = 'content'
);
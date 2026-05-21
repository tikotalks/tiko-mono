-- Debug script to check marketing site content
-- Run this in Supabase SQL editor to see what's actually stored

-- 1. Check the marketing home page sections
SELECT 
    ps.id as page_section_id,
    ps.order_index,
    ps.override_name,
    ps.section_id,
    s.name as section_name,
    s.slug as section_slug
FROM content_page_sections ps
LEFT JOIN content_sections s ON s.id = ps.section_id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- 2. Check what content data exists for these sections
SELECT 
    ps.override_name,
    ps.section_id,
    sd.field_key,
    sd.value,
    sd.language_code
FROM content_page_sections ps
LEFT JOIN content_section_data sd ON sd.section_id = ps.section_id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
    AND ps.section_id IS NOT NULL
ORDER BY ps.order_index, sd.field_key;

-- 3. Check if there's any content_section_data at all
SELECT COUNT(*) as total_section_data_rows FROM content_section_data;

-- 4. Show sample content_section_data entries
SELECT * FROM content_section_data LIMIT 10;

-- 5. Check specific section IDs from the marketing page
SELECT 
    s.id,
    s.name,
    s.slug,
    COUNT(sd.id) as content_fields_count
FROM content_sections s
LEFT JOIN content_section_data sd ON sd.section_id = s.id
WHERE s.id IN (
    '2be87ea5-20b6-4d35-a4ac-90b2724db534', -- Intro
    'f98d74b7-958e-4100-a705-3966ca401e72', -- About  
    '944499b5-3613-4816-a6af-1f8a195a8b5a', -- Apps
    '31377d06-1e6d-4706-9284-d8894e5a9e24', -- Languages
    '81d10182-da3d-4a20-9121-b59c28ed307f'  -- Funding
)
GROUP BY s.id, s.name, s.slug;
-- Check what content data exists for the marketing home page sections

-- 1. Show all content_section_data for the specific section IDs
SELECT 
    sd.section_id,
    s.name as section_name,
    sd.field_key,
    sd.value,
    sd.language_code
FROM content_section_data sd
JOIN content_sections s ON s.id = sd.section_id
WHERE sd.section_id IN (
    '2be87ea5-20b6-4d35-a4ac-90b2724db534', -- Intro
    'f98d74b7-958e-4100-a705-3966ca401e72', -- About
    '944499b5-3613-4816-a6af-1f8a195a8b5a', -- Apps
    '31377d06-1e6d-4706-9284-d8894e5a9e24', -- Languages
    '81d10182-da3d-4a20-9121-b59c28ed307f'  -- Funding
)
ORDER BY s.name, sd.field_key;

-- 2. Count how many fields each section has
SELECT 
    s.id,
    s.name,
    s.language_code as section_language,
    COUNT(sd.id) as field_count
FROM content_sections s
LEFT JOIN content_section_data sd ON sd.section_id = s.id
WHERE s.id IN (
    '2be87ea5-20b6-4d35-a4ac-90b2724db534',
    'f98d74b7-958e-4100-a705-3966ca401e72',
    '944499b5-3613-4816-a6af-1f8a195a8b5a',
    '31377d06-1e6d-4706-9284-d8894e5a9e24',
    '81d10182-da3d-4a20-9121-b59c28ed307f'
)
GROUP BY s.id, s.name, s.language_code;

-- 3. Check if there's ANY data in content_section_data table
SELECT COUNT(*) as total_rows FROM content_section_data;

-- 4. Show the first 10 rows to see the data structure
SELECT * FROM content_section_data LIMIT 10;
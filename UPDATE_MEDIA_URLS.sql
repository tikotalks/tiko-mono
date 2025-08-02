-- Update all media URLs from media.tikocdn.org to data.tikocdn.org
-- This script updates all references in the media and content tables

-- Update media table URLs
UPDATE media 
SET 
  original_url = REPLACE(original_url, 'https://media.tikocdn.org/', 'https://data.tikocdn.org/'),
  medium_url = REPLACE(medium_url, 'https://media.tikocdn.org/', 'https://data.tikocdn.org/'),
  thumbnail_url = REPLACE(thumbnail_url, 'https://media.tikocdn.org/', 'https://data.tikocdn.org/')
WHERE 
  original_url LIKE '%media.tikocdn.org%' 
  OR medium_url LIKE '%media.tikocdn.org%'
  OR thumbnail_url LIKE '%media.tikocdn.org%';

-- Update content_section_data values (JSONB)
UPDATE content_section_data
SET value = REPLACE(value::text, 'media.tikocdn.org', 'data.tikocdn.org')::jsonb
WHERE value::text LIKE '%media.tikocdn.org%';

-- Verify the updates
SELECT 'Media table updated URLs:' as info, COUNT(*) as count 
FROM media 
WHERE original_url LIKE '%data.tikocdn.org%';

SELECT 'Content section data updated URLs:' as info, COUNT(*) as count 
FROM content_section_data 
WHERE value::text LIKE '%data.tikocdn.org%';
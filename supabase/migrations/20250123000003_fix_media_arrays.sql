-- Fix any NULL values in tags and categories columns
UPDATE media 
SET tags = '{}' 
WHERE tags IS NULL;

UPDATE media 
SET categories = '{}' 
WHERE categories IS NULL;

-- Ensure columns are NOT NULL with defaults
ALTER TABLE media 
ALTER COLUMN tags SET NOT NULL,
ALTER COLUMN tags SET DEFAULT '{}',
ALTER COLUMN categories SET NOT NULL,
ALTER COLUMN categories SET DEFAULT '{}';
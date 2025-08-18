-- Change the default value of is_public to true for assets table
-- This ensures all newly uploaded assets are public by default

ALTER TABLE assets 
ALTER COLUMN is_public SET DEFAULT true;

-- Also update all existing assets to be public (optional - remove if you want to keep current privacy settings)
UPDATE assets SET is_public = true WHERE is_public = false;
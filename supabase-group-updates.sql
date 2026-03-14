-- ========================================
-- Database Updates for Group Functionality
-- ========================================

-- Step 1: Check your current table structure first
-- Run this to see what you currently have:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items' 
ORDER BY column_name;

-- Step 2: Add new columns for group functionality
-- Note: This assumes you have an 'items' table with a 'type' column that's a TEXT/VARCHAR

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS sequences TEXT[], -- Array of sequence IDs in this group
ADD COLUMN IF NOT EXISTS sequence_count INTEGER DEFAULT 0; -- Number of sequences in the group

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_sequences ON items USING GIN(sequences); -- For array searches

-- Step 4: Add comments to document the new columns
COMMENT ON COLUMN items.sequences IS 'Array of sequence IDs that belong to this group';
COMMENT ON COLUMN items.sequence_count IS 'Cached count of sequences in the group for performance';

-- Step 5: Create trigger to automatically update sequence_count (optional but recommended)
CREATE OR REPLACE FUNCTION update_sequence_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update the sequence count based on the sequences array
        NEW.sequence_count = COALESCE(array_length(NEW.sequences, 1), 0);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_sequence_count ON items;

-- Create trigger to automatically update sequence_count
CREATE TRIGGER trigger_update_sequence_count
    BEFORE INSERT OR UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_sequence_count();

-- Step 6: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
AND column_name IN ('sequences', 'sequence_count')
ORDER BY column_name;

-- Step 7: Test query to see current types in your database
-- This helps verify what type values you currently have
SELECT DISTINCT type, COUNT(*) as count 
FROM items 
GROUP BY type 
ORDER BY type;

-- ========================================
-- Add Translation Keys for Hidden Items Feature
-- ========================================

-- Add sequence hidden items translation keys
-- Migration: Add sequence.showHiddenItems and sequence.showHiddenItemsDescription translation keys

-- Add the translation keys if they don't already exist
INSERT INTO public.i18n_keys (key, category, description, created_by, created_at, updated_at)
SELECT 
  'sequence.showHiddenItems',
  'sequence',
  'Toggle to show/hide hidden items in sequence',
  auth.uid(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.i18n_keys WHERE key = 'sequence.showHiddenItems'
);

INSERT INTO public.i18n_keys (key, category, description, created_by, created_at, updated_at)
SELECT 
  'sequence.showHiddenItemsDescription',
  'sequence',
  'Description for the show hidden items toggle feature',
  auth.uid(),
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.i18n_keys WHERE key = 'sequence.showHiddenItemsDescription'
);

-- Add English translations for the keys
INSERT INTO public.i18n_translations (key_id, language_code, value, version, is_published, created_by, created_at, updated_at)
SELECT 
  k.id,
  'en',
  CASE 
    WHEN k.key = 'sequence.showHiddenItems' THEN 'Show Hidden Items'
    WHEN k.key = 'sequence.showHiddenItemsDescription' THEN 'Display items that are normally hidden in the sequence view'
  END,
  1,
  true,
  auth.uid(),
  NOW(),
  NOW()
FROM public.i18n_keys k
WHERE k.key IN ('sequence.showHiddenItems', 'sequence.showHiddenItemsDescription')
ON CONFLICT (key_id, language_code, version) DO UPDATE SET
  value = EXCLUDED.value,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Add British English translations if they don't exist
INSERT INTO public.i18n_translations (key_id, language_code, value, version, is_published, created_by, created_at, updated_at)
SELECT 
  k.id,
  'en-GB',
  CASE 
    WHEN k.key = 'sequence.showHiddenItems' THEN 'Show Hidden Items'
    WHEN k.key = 'sequence.showHiddenItemsDescription' THEN 'Display items that are normally hidden in the sequence view'
  END,
  1,
  true,
  auth.uid(),
  NOW(),
  NOW()
FROM public.i18n_keys k
WHERE k.key IN ('sequence.showHiddenItems', 'sequence.showHiddenItemsDescription')
ON CONFLICT (key_id, language_code, version) DO UPDATE SET
  value = EXCLUDED.value,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Add Dutch translations if they don't exist
INSERT INTO public.i18n_translations (key_id, language_code, value, version, is_published, created_by, created_at, updated_at)
SELECT 
  k.id,
  'nl',
  CASE 
    WHEN k.key = 'sequence.showHiddenItems' THEN 'Verborgen items tonen'
    WHEN k.key = 'sequence.showHiddenItemsDescription' THEN 'Toon items die normaal geschoold zijn in de sequence weergave'
  END,
  1,
  true,
  auth.uid(),
  NOW(),
  NOW()
FROM public.i18n_keys k
WHERE k.key IN ('sequence.showHiddenItems', 'sequence.showHiddenItemsDescription')
ON CONFLICT (key_id, language_code, version) DO UPDATE SET
  value = EXCLUDED.value,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

-- Add Dutch-Belgium translations if they don't exist
INSERT INTO public.i18n_translations (key_id, language_code, value, version, is_published, created_by, created_at, updated_at)
SELECT 
  k.id,
  'nl-BE',
  CASE 
    WHEN k.key = 'sequence.showHiddenItems' THEN 'Verborgen items tonen'
    WHEN k.key = 'sequence.showHiddenItemsDescription' THEN 'Toon items die normaal geschoold zijn in de sequence weergave'
  END,
  1,
  true,
  auth.uid(),
  NOW(),
  NOW()
FROM public.i18n_keys k
WHERE k.key IN ('sequence.showHiddenItems', 'sequence.showHiddenItemsDescription')
ON CONFLICT (key_id, language_code, version) DO UPDATE SET
  value = EXCLUDED.value,
  is_published = EXCLUDED.is_published,
  updated_at = NOW();

COMMIT;
-- Fix the constraints on content_page_sections table

-- 1. Drop the problematic unique constraint
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS unique_page_section_instance;

-- 2. Drop the current primary key
ALTER TABLE content_page_sections 
DROP CONSTRAINT IF EXISTS content_page_sections_pkey;

-- 3. Add an id column if it doesn't exist
ALTER TABLE content_page_sections 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- 4. Create a better unique constraint that allows multiple sections per page
-- This ensures you can't add the exact same section instance twice to the same page at the same position
ALTER TABLE content_page_sections
ADD CONSTRAINT unique_page_section_order 
UNIQUE (page_id, section_id, order_index);

-- 5. Verify the new structure
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    string_agg(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'content_page_sections'
GROUP BY tc.constraint_name, tc.constraint_type;
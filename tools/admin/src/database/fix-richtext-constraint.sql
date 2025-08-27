-- Fix content_fields constraint to include all necessary field types

-- Step 1: Check what field types are currently in use
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;

-- Step 2: Check if any field types would violate the new constraint
SELECT id, field_key, field_type, label 
FROM content_fields
WHERE field_type NOT IN (
    'text', 'textarea', 'richtext', 'number', 'boolean', 
    'select', 'date', 'image', 'file', 'repeater', 
    'relation', 'items', 'list', 'object', 'json', 
    'linked_items', 'media', 'media_list', 'color', 'options'
);

-- Step 3: Fix the constraint
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE content_fields 
    DROP CONSTRAINT IF EXISTS content_fields_field_type_check;
    
    -- Add comprehensive constraint with all field types
    ALTER TABLE content_fields 
    ADD CONSTRAINT content_fields_field_type_check 
    CHECK (field_type IN (
        'text',           -- Single line text
        'textarea',       -- Multi-line text
        'richtext',       -- Rich text editor (TipTap)
        'number',         -- Numeric values
        'boolean',        -- True/false
        'select',         -- Dropdown selection
        'date',           -- Date picker
        'image',          -- Single image (legacy, use media)
        'file',           -- File upload (legacy, use media)
        'repeater',       -- Repeatable fields
        'relation',       -- Relation to other content
        'items',          -- Reference to content items
        'list',           -- List of values
        'object',         -- JSON object
        'json',           -- JSON data
        'linked_items',   -- Multiple linked items
        'media',          -- Single media file
        'media_list',     -- Multiple media files
        'color',          -- Color picker
        'options'         -- Multiple choice options
    ));
    
    RAISE NOTICE 'Successfully updated content_fields constraint to include all field types';
END $$;

-- Step 4: Verify the constraint was applied
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'content_fields_field_type_check';

-- Step 5: Show current field type usage after fix
SELECT 
    field_type, 
    COUNT(*) as usage_count,
    STRING_AGG(DISTINCT field_key, ', ' ORDER BY field_key) as example_fields
FROM content_fields
GROUP BY field_type
ORDER BY usage_count DESC, field_type;
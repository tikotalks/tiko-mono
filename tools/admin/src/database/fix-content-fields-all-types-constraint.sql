-- Fix the content_fields table constraint to include all field types used in the UI
-- This drops the existing constraint and recreates it with the complete list

-- First, check if the constraint exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'content_fields_field_type_check' 
        AND conrelid = 'content_fields'::regclass
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE content_fields 
        DROP CONSTRAINT content_fields_field_type_check;
        
        RAISE NOTICE 'Dropped existing content_fields_field_type_check constraint';
    ELSE
        RAISE NOTICE 'No existing content_fields_field_type_check constraint found';
    END IF;
END $$;

-- Add the new constraint with all field types from the UI
ALTER TABLE content_fields 
ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type IN (
    'text',
    'textarea',
    'richtext',
    'number',
    'boolean',
    'select',
    'media',
    'media_list',
    'list',
    'object',
    'items',        -- For selecting multiple content items
    'repeater',     -- For repeatable field groups
    'linked_items'  -- For referencing content items (only for section templates)
));

-- Verify the constraint was created successfully
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_fields'::regclass
AND conname = 'content_fields_field_type_check';

-- Show current field types in use
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;
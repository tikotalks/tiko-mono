-- Add 'color' field type to content_fields table constraint
-- This migration adds support for color picker fields in the content management system

-- First, check if the constraint exists and drop it
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

-- Add the new constraint with all field types including 'color'
ALTER TABLE content_fields 
ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type IN (
    'text',
    'textarea',
    'richtext',
    'number',
    'boolean',
    'color',        -- NEW: Color picker field type
    'select',
    'media',
    'media_list',
    'list',
    'object',
    'items',
    'repeater',
    'linked_items'
));

-- Verify the constraint was created successfully
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_fields'::regclass
AND conname = 'content_fields_field_type_check';

-- Show current field types in use (including any new color fields)
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;
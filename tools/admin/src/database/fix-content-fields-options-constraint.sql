-- Fix the content_fields table constraint to include 'options' as an allowed field_type
-- This drops the existing constraint and recreates it with the updated list

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

-- Add the new constraint with 'options' included
ALTER TABLE content_fields 
ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type IN (
    'text',
    'textarea',
    'richtext',
    'number',
    'boolean',
    'select',
    'options',      -- Added to support multiple choice options
    'media',
    'media_list',
    'list',
    'object'
));

-- Verify the constraint was created successfully
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_fields'::regclass
AND conname = 'content_fields_field_type_check';

-- Additional notes on the 'options' field type:
-- The 'options' field type stores configuration in the config JSONB column
-- Format for simple options: {"options": ["Option 1", "Option 2", "Option 3"]}
-- Format for key-value options: {"options": [{"key": "opt1", "value": "Option 1"}, {"key": "opt2", "value": "Option 2"}]}
-- This allows for radio buttons, checkboxes, or multi-select UI components
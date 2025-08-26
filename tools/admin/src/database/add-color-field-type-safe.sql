-- Safe migration to add 'color' field type to content_fields table
-- This version checks existing data first

-- First, let's see what field types are currently in use
DO $$
DECLARE
    invalid_types TEXT;
    current_constraint TEXT;
BEGIN
    -- Get current constraint definition
    SELECT pg_get_constraintdef(oid) 
    INTO current_constraint
    FROM pg_constraint 
    WHERE conname = 'content_fields_field_type_check' 
    AND conrelid = 'content_fields'::regclass;
    
    RAISE NOTICE 'Current constraint: %', current_constraint;
    
    -- Check for field types that would violate the new constraint
    SELECT string_agg(DISTINCT field_type, ', ')
    INTO invalid_types
    FROM content_fields
    WHERE field_type NOT IN (
        'text',
        'textarea', 
        'richtext',
        'number',
        'boolean',
        'color',
        'select',
        'media',
        'media_list',
        'list',
        'object',
        'items',
        'repeater',
        'linked_items',
        'options'  -- Adding this as it might be in use
    );
    
    IF invalid_types IS NOT NULL THEN
        RAISE NOTICE 'Found field types that would violate new constraint: %', invalid_types;
        RAISE NOTICE 'Please update or remove these fields before running migration';
        RAISE EXCEPTION 'Migration aborted due to incompatible field types: %', invalid_types;
    END IF;
    
    -- If we get here, it's safe to update the constraint
    -- Drop the existing constraint
    ALTER TABLE content_fields 
    DROP CONSTRAINT content_fields_field_type_check;
    
    RAISE NOTICE 'Dropped existing constraint';
    
    -- Add the new constraint with color field type
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
        'options',      -- Keep for backwards compatibility
        'media',
        'media_list',
        'list',
        'object',
        'items',
        'repeater',
        'linked_items'
    ));
    
    RAISE NOTICE 'Added new constraint including color field type';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
        RAISE;
END $$;

-- Show the final state
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;
-- Add 'items' to the content_fields field_type constraint
-- This allows creating repeatable fields (like testimonials, features, etc.)

-- First, drop the existing constraint
ALTER TABLE content_fields 
DROP CONSTRAINT IF EXISTS content_fields_field_type_check;

-- Add the new constraint with 'items' included
ALTER TABLE content_fields 
ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type IN (
    'text',
    'textarea',
    'richtext',
    'number',
    'boolean',
    'select',
    'options',
    'items',        -- Added for repeatable field groups
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

-- Note about the 'items' field type:
-- The 'items' field type allows creating repeatable groups of fields
-- Configuration is stored in the config JSONB column with this structure:
-- {
--   "fields": [
--     {"key": "title", "label": "Title", "type": "text", "required": true},
--     {"key": "content", "label": "Content", "type": "textarea", "required": false}
--   ],
--   "min_items": 0,
--   "max_items": 10
-- }
-- Values are stored as JSONB array of objects
-- Add 'options' to the allowed field types in content_fields
ALTER TABLE content_fields 
DROP CONSTRAINT IF EXISTS content_fields_field_type_check;

ALTER TABLE content_fields 
ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type IN ('text', 'textarea', 'richtext', 'number', 'boolean', 'select', 'options', 'media', 'media_list', 'list', 'object'));

-- The config column will store the options in this format:
-- For simple options: {"options": ["Option 1", "Option 2", "Option 3"]}
-- For key-value options: {"options": [{"key": "opt1", "value": "Option 1"}, {"key": "opt2", "value": "Option 2"}]}
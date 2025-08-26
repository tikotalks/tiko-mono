-- Diagnose current field types in content_fields table
-- This will show us what field types are currently being used

-- Show all unique field types currently in the database
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;

-- Show any field types that would violate the new constraint
SELECT id, field_type, label, section_template_id, item_template_id
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
    'linked_items'
)
ORDER BY field_type;
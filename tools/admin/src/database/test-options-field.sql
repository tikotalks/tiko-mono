-- Test creating an options field with config to verify it works

-- First, let's check if we have any section templates
SELECT id, name, slug FROM content_section_templates LIMIT 5;

-- Create a test field with options config
-- You'll need to replace 'SECTION_TEMPLATE_ID' with an actual ID from above
/*
INSERT INTO content_fields (
    section_template_id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config
) VALUES (
    'SECTION_TEMPLATE_ID',
    'test_options',
    'Test Options Field',
    'options',
    false,
    true,
    99,
    '{"options": ["Option 1", "Option 2", {"key": "opt3", "value": "Option 3"}]}'::jsonb
);
*/

-- Then check if it was saved correctly
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config,
    jsonb_pretty(f.config) as pretty_config
FROM content_fields f
WHERE f.field_type = 'options'
ORDER BY f.created_at DESC;
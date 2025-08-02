-- Comprehensive test to verify options field functionality

-- 1. Check if we have the 'options' field type in the constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'content_fields_field_type_check';

-- 2. Check all fields with config data
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config IS NOT NULL as has_config,
    jsonb_pretty(f.config) as config_pretty,
    st.name as template_name
FROM content_fields f
JOIN content_section_templates st ON f.section_template_id = st.id
WHERE f.config IS NOT NULL
ORDER BY f.created_at DESC;

-- 3. Specifically check options fields
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config,
    jsonb_pretty(f.config) as config_pretty,
    st.name as template_name,
    f.created_at,
    f.updated_at
FROM content_fields f
JOIN content_section_templates st ON f.section_template_id = st.id
WHERE f.field_type = 'options'
ORDER BY f.created_at DESC;

-- 4. Test creating an options field manually
-- First get a section template ID
SELECT id, name, slug 
FROM content_section_templates 
WHERE is_active = true
LIMIT 3;

-- Then you can test creating a field with:
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
    'YOUR_SECTION_TEMPLATE_ID_HERE',
    'test_options_field',
    'Test Options Field',
    'options',
    false,
    true,
    999,
    jsonb_build_object(
        'options', jsonb_build_array(
            'Option 1',
            'Option 2',
            jsonb_build_object('key', 'opt3', 'value', 'Option 3')
        )
    )
);
*/
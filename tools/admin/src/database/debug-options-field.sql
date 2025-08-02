-- Debug query to check if options field config is being saved
-- This will show the raw config data for all options fields

-- Show all fields with their config data
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config,
    jsonb_pretty(f.config) as pretty_config,
    st.name as section_template_name
FROM content_fields f
JOIN content_section_templates st ON f.section_template_id = st.id
WHERE f.config IS NOT NULL
ORDER BY f.created_at DESC
LIMIT 10;

-- Specifically look for options fields
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config,
    jsonb_pretty(f.config) as pretty_config,
    st.name as section_template_name
FROM content_fields f
JOIN content_section_templates st ON f.section_template_id = st.id
WHERE f.field_type = 'options'
ORDER BY f.created_at DESC;

-- Check the most recent field created
SELECT 
    f.*,
    jsonb_pretty(f.config) as pretty_config
FROM content_fields f
ORDER BY f.created_at DESC
LIMIT 5;
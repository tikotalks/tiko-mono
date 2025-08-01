-- Check field configurations for options field type
-- This helps debug if options are being saved correctly

-- Check all fields with type 'options' and their config
SELECT 
    f.id,
    f.field_key,
    f.label,
    f.field_type,
    f.config,
    st.name as section_template_name
FROM content_fields f
JOIN content_section_templates st ON f.section_template_id = st.id
WHERE f.field_type = 'options'
ORDER BY st.name, f.order_index;

-- Check if any fields have config data
SELECT 
    field_type,
    COUNT(*) as count,
    COUNT(CASE WHEN config IS NOT NULL THEN 1 END) as with_config
FROM content_fields
GROUP BY field_type
ORDER BY field_type;

-- Look at a specific field's config in detail
-- Replace 'YOUR_FIELD_ID' with an actual field ID to debug
-- SELECT 
--     id,
--     field_key,
--     label,
--     field_type,
--     config,
--     jsonb_pretty(config) as pretty_config
-- FROM content_fields
-- WHERE id = 'YOUR_FIELD_ID';
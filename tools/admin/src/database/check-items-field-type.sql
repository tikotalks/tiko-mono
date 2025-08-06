-- Check the field type for the 'items' field
SELECT 
    f.id,
    f.field_key,
    f.field_type,
    f.label,
    f.section_template_id,
    st.name as template_name
FROM 
    content_fields f
    JOIN content_section_templates st ON f.section_template_id = st.id
WHERE 
    f.field_key = 'items';

-- If the field type is not 'linked_items', update it
-- UPDATE content_fields 
-- SET field_type = 'linked_items'
-- WHERE field_key = 'items' 
-- AND section_template_id IN (
--     SELECT id FROM content_section_templates WHERE name ILIKE '%app%'
-- );
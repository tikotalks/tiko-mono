-- List all tables to see what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%content%' OR table_name LIKE '%item%')
ORDER BY table_name;

-- Also check what fields are defined for the app item template
SELECT 
    f.field_key,
    f.field_type,
    f.label,
    f.is_translatable
FROM 
    content_fields f
WHERE 
    f.item_template_id = '38230efd-0835-44b1-88db-e63cc6c92157'
ORDER BY 
    f.order_index;
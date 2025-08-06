-- Check the column definitions for content_items table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'content_items'
ORDER BY 
    ordinal_position;
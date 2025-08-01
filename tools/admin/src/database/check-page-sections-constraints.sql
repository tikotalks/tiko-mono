-- Check constraints on content_page_sections
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'content_page_sections'
AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
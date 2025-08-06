-- Check what columns exist in content_fields table
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'content_fields'
ORDER BY ordinal_position;

-- Check if there's any order-related column
SELECT *
FROM content_fields
WHERE field_key = 'items'
LIMIT 1;
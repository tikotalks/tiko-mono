-- Check the current constraint on content_fields.field_type
-- This will show the constraint definition

-- Method 1: Query pg_constraint to see the check constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_fields'::regclass
AND contype = 'c'
AND conname LIKE '%field_type%';

-- Method 2: Query information_schema
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%content_fields%field_type%';

-- Method 3: Show all constraints on the content_fields table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'content_fields'::regclass
ORDER BY conname;

-- Check current field_type values in use
SELECT DISTINCT field_type, COUNT(*) as count
FROM content_fields
GROUP BY field_type
ORDER BY field_type;

-- Check if there are any 'options' field types that would violate the constraint
SELECT id, field_key, field_type, config
FROM content_fields
WHERE field_type = 'options';
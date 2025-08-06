-- Check if field_type enum exists and what values it has
SELECT 
    n.nspname as schema,
    t.typname as name,
    e.enumlabel as value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname LIKE '%field%'
ORDER BY t.typname, e.enumsortorder;
-- Find the field with label containing "richtext"
SELECT id, field_key, label, field_type 
FROM content_fields 
WHERE label LIKE '%richtext%';

-- Update that specific field to richtext type
UPDATE content_fields 
SET field_type = 'richtext'
WHERE label LIKE '%richtext%' 
AND field_type = 'textarea';

-- Verify the update worked
SELECT id, field_key, label, field_type 
FROM content_fields 
WHERE label LIKE '%richtext%';
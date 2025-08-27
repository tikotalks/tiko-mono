-- Update specific textarea fields to richtext
-- This will change the field type for content fields that should use the rich text editor

-- First, let's see what textarea fields exist
SELECT id, field_key, label, field_type 
FROM content_fields 
WHERE field_type = 'textarea'
AND field_key IN ('content', 'description', 'body', 'text');

-- Update content fields to richtext
UPDATE content_fields 
SET field_type = 'richtext',
    config = jsonb_build_object(
        'height', '400px',
        'features', ARRAY[
            'bold', 'italic', 'underline', 'strike', 
            'heading', 'bulletList', 'orderedList', 
            'blockquote', 'link', 'code', 'undo', 'redo'
        ]::text[]
    )
WHERE field_type = 'textarea'
AND field_key IN ('content', 'description');

-- Verify the update
SELECT id, field_key, label, field_type, config
FROM content_fields 
WHERE field_key IN ('content', 'description')
ORDER BY field_key;
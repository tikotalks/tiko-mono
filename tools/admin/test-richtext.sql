-- Find a section template and add a richtext field for testing
-- First, let's see what section templates exist
SELECT id, name FROM content_section_templates LIMIT 5;

-- Add a richtext field to the first section template we find
INSERT INTO content_fields (
    section_template_id,
    field_key,
    label,
    field_type,
    is_required,
    order_index,
    config
) 
SELECT 
    id,
    'rich_content',
    'Rich Content Editor',
    'richtext',
    false,
    99,
    jsonb_build_object(
        'height', '400px',
        'features', ARRAY['bold', 'italic', 'underline', 'strike', 'h1', 'h2', 'h3', 'bulletList', 'orderedList', 'blockquote', 'link', 'code', 'undo', 'redo']
    )
FROM content_section_templates
WHERE NOT EXISTS (
    SELECT 1 FROM content_fields 
    WHERE field_key = 'rich_content' 
    AND section_template_id = content_section_templates.id
)
LIMIT 1;

-- Also update an existing textarea field to richtext to test
UPDATE content_fields
SET field_type = 'richtext',
    config = jsonb_build_object(
        'height', '350px',
        'features', ARRAY['bold', 'italic', 'underline', 'strike', 'h1', 'h2', 'h3', 'bulletList', 'orderedList', 'blockquote', 'link']
    )
WHERE field_type = 'textarea'
AND field_key IN ('description', 'content', 'body', 'text')
LIMIT 1;
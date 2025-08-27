-- Add richtext to allowed field types if not already present
DO $$ 
BEGIN
    -- First check current constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'content_fields_field_type_check'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE content_fields 
        DROP CONSTRAINT IF EXISTS content_fields_field_type_check;
    END IF;
    
    -- Add new constraint with richtext included
    ALTER TABLE content_fields 
    ADD CONSTRAINT content_fields_field_type_check 
    CHECK (field_type IN (
        'text',           -- Single line text
        'textarea',       -- Multi-line text
        'richtext',       -- Rich text editor (TipTap)
        'number',         -- Numeric values
        'boolean',        -- True/false
        'select',         -- Dropdown selection
        'date',           -- Date picker
        'image',          -- Single image (legacy, use media)
        'file',           -- File upload (legacy, use media)
        'repeater',       -- Repeatable fields
        'relation',       -- Relation to other content
        'items',          -- Reference to content items
        'list',           -- List of values
        'object',         -- JSON object
        'json',           -- JSON data
        'linked_items',   -- Multiple linked items
        'media',          -- Single media file
        'media_list',     -- Multiple media files
        'color',          -- Color picker
        'options'         -- Multiple choice options
    ));
    
    RAISE NOTICE 'Successfully added richtext to allowed field types';
END $$;

-- Example: Update an existing textarea field to richtext for testing
-- UPDATE content_fields 
-- SET field_type = 'richtext' 
-- WHERE field_key = 'description' 
-- AND field_type = 'textarea'
-- LIMIT 1;

-- Or add a new richtext field to an existing section template
-- INSERT INTO content_fields (
--     section_template_id,
--     field_key,
--     label,
--     field_type,
--     is_required,
--     order_index
-- ) VALUES (
--     (SELECT id FROM content_section_templates WHERE name = 'Hero Section' LIMIT 1),
--     'rich_content',
--     'Rich Content',
--     'richtext',
--     false,
--     10
-- );
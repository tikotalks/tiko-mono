-- Example of creating a section template with an items field
-- This demonstrates how to use the new "items" field type for repeatable content

-- First, create a testimonials section template
INSERT INTO content_section_templates (
    id,
    name,
    slug,
    description,
    component_type,
    is_reusable,
    is_active
) VALUES (
    gen_random_uuid(),
    'Testimonials',
    'testimonials',
    'Customer testimonials section with repeatable items',
    'testimonials',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    component_type = EXCLUDED.component_type;

-- Get the section template ID
WITH template AS (
    SELECT id FROM content_section_templates WHERE slug = 'testimonials'
)
-- Add fields to the template
INSERT INTO content_fields (
    section_template_id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config
) 
SELECT 
    template.id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config::jsonb
FROM template, (VALUES
    -- Title field
    ('title', 'Section Title', 'text', true, true, 0, NULL),
    
    -- Subtitle field
    ('subtitle', 'Section Subtitle', 'textarea', false, true, 1, NULL),
    
    -- Testimonials items field
    ('testimonials', 'Testimonials', 'items', true, true, 2, 
     '{
       "fields": [
         {
           "key": "author",
           "label": "Author Name",
           "type": "text",
           "required": true,
           "placeholder": "John Doe"
         },
         {
           "key": "role",
           "label": "Role/Title",
           "type": "text",
           "required": false,
           "placeholder": "CEO at Company"
         },
         {
           "key": "content",
           "label": "Testimonial Content",
           "type": "textarea",
           "required": true,
           "placeholder": "Write the testimonial here..."
         },
         {
           "key": "rating",
           "label": "Rating (1-5)",
           "type": "number",
           "required": false,
           "default": 5
         }
       ],
       "min_items": 1,
       "max_items": 10,
       "default_items": 3
     }'::text)
) AS fields(field_key, label, field_type, is_required, is_translatable, order_index, config)
ON CONFLICT (section_template_id, field_key) DO UPDATE SET
    label = EXCLUDED.label,
    field_type = EXCLUDED.field_type,
    is_required = EXCLUDED.is_required,
    is_translatable = EXCLUDED.is_translatable,
    order_index = EXCLUDED.order_index,
    config = EXCLUDED.config;

-- Create another example: FAQ section with items
INSERT INTO content_section_templates (
    id,
    name,
    slug,
    description,
    component_type,
    is_reusable,
    is_active
) VALUES (
    gen_random_uuid(),
    'FAQ',
    'faq',
    'Frequently Asked Questions section with repeatable Q&A items',
    'faq',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    component_type = EXCLUDED.component_type;

-- Add fields to FAQ template
WITH template AS (
    SELECT id FROM content_section_templates WHERE slug = 'faq'
)
INSERT INTO content_fields (
    section_template_id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config
) 
SELECT 
    template.id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config::jsonb
FROM template, (VALUES
    -- Title field
    ('title', 'Section Title', 'text', true, true, 0, NULL),
    
    -- FAQ items field
    ('faqs', 'FAQ Items', 'items', true, true, 1, 
     '{
       "fields": [
         {
           "key": "question",
           "label": "Question",
           "type": "text",
           "required": true,
           "placeholder": "What is your question?"
         },
         {
           "key": "answer",
           "label": "Answer",
           "type": "textarea",
           "required": true,
           "placeholder": "Provide a detailed answer..."
         }
       ],
       "min_items": 1,
       "max_items": 20
     }'::text)
) AS fields(field_key, label, field_type, is_required, is_translatable, order_index, config)
ON CONFLICT (section_template_id, field_key) DO UPDATE SET
    label = EXCLUDED.label,
    field_type = EXCLUDED.field_type,
    is_required = EXCLUDED.is_required,
    is_translatable = EXCLUDED.is_translatable,
    order_index = EXCLUDED.order_index,
    config = EXCLUDED.config;

-- Create a features section with items
INSERT INTO content_section_templates (
    id,
    name,
    slug,
    description,
    component_type,
    is_reusable,
    is_active
) VALUES (
    gen_random_uuid(),
    'Features List',
    'features-list',
    'Product features section with repeatable feature items',
    'features',
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description,
    component_type = EXCLUDED.component_type;

-- Add fields to features template
WITH template AS (
    SELECT id FROM content_section_templates WHERE slug = 'features-list'
)
INSERT INTO content_fields (
    section_template_id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config
) 
SELECT 
    template.id,
    field_key,
    label,
    field_type,
    is_required,
    is_translatable,
    order_index,
    config::jsonb
FROM template, (VALUES
    -- Title field
    ('title', 'Section Title', 'text', true, true, 0, NULL),
    
    -- Display type
    ('display_type', 'Display Type', 'select', false, false, 1,
     '{"options": [
       {"value": "grid", "label": "Grid Layout"},
       {"value": "list", "label": "List Layout"},
       {"value": "carousel", "label": "Carousel"}
     ]}'::text),
    
    -- Features items field
    ('features', 'Features', 'items', true, true, 2, 
     '{
       "fields": [
         {
           "key": "title",
           "label": "Feature Title",
           "type": "text",
           "required": true,
           "placeholder": "Amazing Feature"
         },
         {
           "key": "description",
           "label": "Feature Description",
           "type": "textarea",
           "required": true,
           "placeholder": "Describe this feature..."
         },
         {
           "key": "icon",
           "label": "Icon Name",
           "type": "text",
           "required": false,
           "placeholder": "e.g., CHECK, STAR, HEART"
         },
         {
           "key": "highlight",
           "label": "Highlight this feature?",
           "type": "boolean",
           "required": false,
           "default": false
         }
       ],
       "min_items": 1,
       "max_items": 12,
       "default_items": 3
     }'::text)
) AS fields(field_key, label, field_type, is_required, is_translatable, order_index, config)
ON CONFLICT (section_template_id, field_key) DO UPDATE SET
    label = EXCLUDED.label,
    field_type = EXCLUDED.field_type,
    is_required = EXCLUDED.is_required,
    is_translatable = EXCLUDED.is_translatable,
    order_index = EXCLUDED.order_index,
    config = EXCLUDED.config;

-- To test the items field, create a section instance with sample data:
/*
-- Create a testimonials section instance
INSERT INTO content_sections (
    section_template_id,
    name,
    slug,
    is_active
)
SELECT 
    id,
    'Homepage Testimonials',
    'homepage-testimonials',
    true
FROM content_section_templates 
WHERE slug = 'testimonials';

-- Add sample data for the testimonials
WITH section AS (
    SELECT id FROM content_sections WHERE slug = 'homepage-testimonials'
)
INSERT INTO content_section_data (section_id, field_key, value, language_code)
SELECT 
    section.id,
    field_key,
    value::jsonb,
    'en'
FROM section, (VALUES
    ('title', '"What Our Customers Say"'),
    ('subtitle', '"Read testimonials from our happy customers"'),
    ('testimonials', '[
      {
        "author": "Sarah Johnson",
        "role": "CEO at TechCorp",
        "content": "This product has transformed how we work. The team loves it!",
        "rating": 5
      },
      {
        "author": "Mike Chen",
        "role": "Designer",
        "content": "Beautiful interface and incredibly easy to use. Highly recommended!",
        "rating": 5
      },
      {
        "author": "Emma Williams",
        "role": "Product Manager",
        "content": "The best solution we have found for our needs. Outstanding support!",
        "rating": 4
      }
    ]')
) AS data(field_key, value);
*/

COMMENT ON COLUMN content_fields.field_type IS 'Field type: text, textarea, richtext, number, boolean, select, options, media, media_list, list, object, items';
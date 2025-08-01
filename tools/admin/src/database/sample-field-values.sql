-- Sample field values for testing
-- This creates some sample content for the sections on the home page

-- First, let's check what fields exist for these section templates
-- You can run this query to see available fields:
-- SELECT ct.name as template_name, cf.* 
-- FROM content_fields cf
-- JOIN content_section_templates ct ON cf.section_template_id = ct.id
-- ORDER BY ct.name, cf.order_index;

-- Example: Add field values for the Hero section on the home page
-- Replace the IDs below with actual IDs from your database

-- Hero Section Field Values
INSERT INTO content_field_values (page_id, section_template_id, field_id, language_code, value)
VALUES 
  -- Title field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', 'e6f30596-1f25-4deb-b067-b5f8902a996b', 
   (SELECT id FROM content_fields WHERE section_template_id = 'e6f30596-1f25-4deb-b067-b5f8902a996b' AND field_key = 'title' LIMIT 1),
   'en', '"Welcome to Tiko"'::jsonb),
  
  -- Subtitle field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', 'e6f30596-1f25-4deb-b067-b5f8902a996b',
   (SELECT id FROM content_fields WHERE section_template_id = 'e6f30596-1f25-4deb-b067-b5f8902a996b' AND field_key = 'subtitle' LIMIT 1),
   'en', '"Educational apps designed for children"'::jsonb),
  
  -- Content field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', 'e6f30596-1f25-4deb-b067-b5f8902a996b',
   (SELECT id FROM content_fields WHERE section_template_id = 'e6f30596-1f25-4deb-b067-b5f8902a996b' AND field_key = 'content' LIMIT 1),
   'en', '"Discover our collection of fun and educational apps that help children learn through play."'::jsonb)
ON CONFLICT (page_id, field_id, language_code, COALESCE(section_template_id, '00000000-0000-0000-0000-000000000000')) 
DO UPDATE SET value = EXCLUDED.value;

-- Intro Section Field Values
INSERT INTO content_field_values (page_id, section_template_id, field_id, language_code, value)
VALUES 
  -- Title field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0',
   (SELECT id FROM content_fields WHERE section_template_id = 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0' AND field_key = 'title' LIMIT 1),
   'en', '"Why Choose Tiko?"'::jsonb),
  
  -- Content field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0',
   (SELECT id FROM content_fields WHERE section_template_id = 'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0' AND field_key = 'content' LIMIT 1),
   'en', '"Our apps are designed by education experts and tested by real families. We believe in screen time that counts."'::jsonb)
ON CONFLICT (page_id, field_id, language_code, COALESCE(section_template_id, '00000000-0000-0000-0000-000000000000')) 
DO UPDATE SET value = EXCLUDED.value;

-- Content Template Field Values (for Languages section)
INSERT INTO content_field_values (page_id, section_template_id, field_id, language_code, value)
VALUES 
  -- Title field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', '4c00d507-81a5-41a7-b09e-13c86a1a911b',
   (SELECT id FROM content_fields WHERE section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b' AND field_key = 'title' LIMIT 1),
   'en', '"Available in Multiple Languages"'::jsonb),
  
  -- Content field
  ('6b8793ed-ced1-4cbf-9447-185250e562d5', '4c00d507-81a5-41a7-b09e-13c86a1a911b',
   (SELECT id FROM content_fields WHERE section_template_id = '4c00d507-81a5-41a7-b09e-13c86a1a911b' AND field_key = 'content' LIMIT 1),
   'en', '"All our apps support multiple languages including English, Spanish, French, German, and more. Perfect for multilingual families!"'::jsonb)
ON CONFLICT (page_id, field_id, language_code, COALESCE(section_template_id, '00000000-0000-0000-0000-000000000000')) 
DO UPDATE SET value = EXCLUDED.value;

-- To verify the data was inserted:
-- SELECT 
--   p.title as page_title,
--   st.name as section_name,
--   cf.field_key,
--   cf.label,
--   fv.value
-- FROM content_field_values fv
-- JOIN content_pages p ON fv.page_id = p.id
-- JOIN content_section_templates st ON fv.section_template_id = st.id
-- JOIN content_fields cf ON fv.field_id = cf.id
-- WHERE p.id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
-- ORDER BY st.name, cf.order_index;
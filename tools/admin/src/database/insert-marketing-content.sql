-- Insert test content for marketing website
-- This script creates a marketing project with a home page and sample sections

-- First, ensure we have a marketing project
INSERT INTO content_projects (name, slug, description, languages, default_language, is_active)
VALUES (
  'Marketing Website',
  'marketing', 
  'Main marketing website content',
  ARRAY['en', 'es', 'fr', 'de'],
  'en',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Get the project ID
WITH project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
)

-- Create a home page for the marketing project
INSERT INTO content_pages (project_id, language_code, slug, title, full_path, is_home, is_published)
SELECT 
  p.id,
  'en',
  'home',
  'Welcome to Tiko',
  '/',
  true,
  true
FROM project p
ON CONFLICT (project_id, language_code, slug) DO NOTHING;

-- Create section templates if they don't exist
INSERT INTO content_section_templates (name, slug, component_type, is_reusable, is_active)
VALUES 
  ('Hero Section', 'hero', 'hero', false, true),
  ('Features Section', 'features', 'features', false, true),
  ('Apps Section', 'apps', 'apps', false, true),
  ('CTA Section', 'cta', 'cta', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Add sections to the home page
WITH page AS (
  SELECT cp.id as page_id 
  FROM content_pages cp
  JOIN content_projects proj ON cp.project_id = proj.id
  WHERE proj.slug = 'marketing' AND cp.slug = 'home'
)
INSERT INTO content_page_sections (page_id, section_template_id, order_index)
SELECT 
  p.page_id,
  st.id,
  CASE st.slug
    WHEN 'hero' THEN 0
    WHEN 'features' THEN 1
    WHEN 'apps' THEN 2
    WHEN 'cta' THEN 3
  END as order_index
FROM page p
CROSS JOIN content_section_templates st
WHERE st.slug IN ('hero', 'features', 'apps', 'cta')
ON CONFLICT (page_id, section_template_id) DO NOTHING;
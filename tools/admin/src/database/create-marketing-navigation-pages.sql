-- Create navigation pages for the marketing website
-- These pages will show up in the navigation menu

BEGIN;

-- Get the marketing project ID
WITH marketing_project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
)

-- Create the About page
INSERT INTO content_pages (
  project_id, 
  language_code, 
  slug, 
  title, 
  full_path, 
  is_home, 
  is_published,
  show_in_navigation,
  navigation_order
)
SELECT 
  mp.id,
  'en',
  'about',
  'About',
  '/about',
  false,
  true,
  true,
  1
FROM marketing_project mp
ON CONFLICT (project_id, language_code, slug) 
DO UPDATE SET 
  show_in_navigation = EXCLUDED.show_in_navigation,
  navigation_order = EXCLUDED.navigation_order,
  is_published = EXCLUDED.is_published;

-- Create the Apps page
INSERT INTO content_pages (
  project_id, 
  language_code, 
  slug, 
  title, 
  full_path, 
  is_home, 
  is_published,
  show_in_navigation,
  navigation_order
)
SELECT 
  mp.id,
  'en',
  'apps',
  'Apps',
  '/apps',
  false,
  true,
  true,
  2
FROM marketing_project mp
ON CONFLICT (project_id, language_code, slug) 
DO UPDATE SET 
  show_in_navigation = EXCLUDED.show_in_navigation,
  navigation_order = EXCLUDED.navigation_order,
  is_published = EXCLUDED.is_published;

-- Create the Sponsors page
INSERT INTO content_pages (
  project_id, 
  language_code, 
  slug, 
  title, 
  full_path, 
  is_home, 
  is_published,
  show_in_navigation,
  navigation_order
)
SELECT 
  mp.id,
  'en',
  'sponsors',
  'Sponsors',
  '/sponsors',
  false,
  true,
  true,
  3
FROM marketing_project mp
ON CONFLICT (project_id, language_code, slug) 
DO UPDATE SET 
  show_in_navigation = EXCLUDED.show_in_navigation,
  navigation_order = EXCLUDED.navigation_order,
  is_published = EXCLUDED.is_published;

-- Also create these pages for other languages
WITH marketing_project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
),
languages AS (
  SELECT unnest(ARRAY['es', 'fr', 'de', 'nl']) as lang
),
pages AS (
  SELECT * FROM (VALUES
    ('about', 'Acerca de', 'À propos', 'Über uns', 'Over'),
    ('apps', 'Aplicaciones', 'Applications', 'Apps', 'Apps'),
    ('sponsors', 'Patrocinadores', 'Sponsors', 'Sponsoren', 'Sponsors')
  ) AS t(slug, title_es, title_fr, title_de, title_nl)
)
INSERT INTO content_pages (
  project_id, 
  language_code, 
  slug, 
  title, 
  full_path, 
  is_home, 
  is_published,
  show_in_navigation,
  navigation_order
)
SELECT 
  mp.id,
  l.lang,
  p.slug,
  CASE l.lang
    WHEN 'es' THEN p.title_es
    WHEN 'fr' THEN p.title_fr
    WHEN 'de' THEN p.title_de
    WHEN 'nl' THEN p.title_nl
  END as title,
  '/' || p.slug,
  false,
  true,
  true,
  CASE p.slug
    WHEN 'about' THEN 1
    WHEN 'apps' THEN 2
    WHEN 'sponsors' THEN 3
  END
FROM marketing_project mp
CROSS JOIN languages l
CROSS JOIN pages p
ON CONFLICT (project_id, language_code, slug) 
DO UPDATE SET 
  show_in_navigation = EXCLUDED.show_in_navigation,
  navigation_order = EXCLUDED.navigation_order,
  is_published = EXCLUDED.is_published,
  title = EXCLUDED.title;

COMMIT;

-- Verify the pages were created
SELECT 
  p.slug,
  p.title,
  p.language_code,
  p.show_in_navigation,
  p.navigation_order,
  p.is_published
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
  AND p.show_in_navigation = true
  AND p.is_home = false
ORDER BY p.language_code, p.navigation_order;
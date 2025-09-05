-- Create navigation menus for the marketing website
-- These menus exist in the database (from the provided JSON data) and this script documents their creation

BEGIN;

-- Get the marketing project ID
WITH marketing_project AS (
  SELECT id FROM content_projects WHERE slug = 'marketing'
)

-- Create/ensure the main header menu exists
INSERT INTO content_navigation_menus (
  id,
  slug,
  name,
  project_id,
  created_at
)
SELECT 
  'eefb246b-d868-4a68-8763-aa50602b1d43',
  'main-header-menu',
  'Main Header Menu',
  mp.id,
  '2025-09-05 12:41:40.390982+00'
FROM marketing_project mp
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Create/ensure the main footer menu exists
INSERT INTO content_navigation_menus (
  id,
  slug,
  name,
  project_id,
  created_at
)
SELECT 
  '5853ecac-66ff-4c29-a533-964be2fa0e76',
  'main-footer-menu',
  'Main Footer Menu',
  mp.id,
  '2025-09-05 12:41:49.954876+00'
FROM marketing_project mp
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Create/ensure the main mobile menu exists
INSERT INTO content_navigation_menus (
  id,
  slug,
  name,
  project_id,
  created_at
)
SELECT 
  '361a2cc4-ec03-47f5-a0fc-356843ba3185',
  'main-mobile-menu',
  'Main Mobile Menu',
  mp.id,
  '2025-09-05 12:42:07.319344+00'
FROM marketing_project mp
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

COMMIT;

-- Verify the menus were created
SELECT 
  m.id,
  m.slug,
  m.name,
  p.slug as project_slug,
  m.created_at
FROM content_navigation_menus m
JOIN content_projects p ON m.project_id = p.id
WHERE p.slug = 'marketing'
ORDER BY m.created_at;

-- Check navigation items for each menu
SELECT 
  m.slug as menu_slug,
  m.name as menu_name,
  COUNT(i.id) as item_count
FROM content_navigation_menus m
LEFT JOIN content_navigation_items i ON i.menu_id = m.id
JOIN content_projects p ON m.project_id = p.id
WHERE p.slug = 'marketing'
GROUP BY m.id, m.slug, m.name
ORDER BY m.created_at;
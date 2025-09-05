-- Verify and debug marketing website navigation structure
-- Run this to check the current state of navigation menus and items

-- 1. Check if marketing project exists
SELECT 
    id,
    name,
    slug,
    languages,
    default_language,
    is_active
FROM content_projects 
WHERE slug = 'marketing';

-- 2. List all navigation menus for the marketing project
SELECT 
    m.id,
    m.slug,
    m.name,
    m.created_at
FROM content_navigation_menus m
JOIN content_projects p ON m.project_id = p.id
WHERE p.slug = 'marketing'
ORDER BY m.created_at;

-- 3. Show navigation structure for each menu
WITH menu_items AS (
  SELECT 
    m.slug as menu_slug,
    m.name as menu_name,
    i.id as item_id,
    i.parent_id,
    i.label,
    i.type,
    i.order_index,
    i.is_visible,
    p.slug as page_slug,
    p.title as page_title
  FROM content_navigation_menus m
  LEFT JOIN content_navigation_items i ON i.menu_id = m.id
  LEFT JOIN content_pages p ON i.page_id = p.id
  JOIN content_projects proj ON m.project_id = proj.id
  WHERE proj.slug = 'marketing'
)
SELECT 
  menu_slug,
  menu_name,
  label,
  type,
  page_slug,
  order_index,
  CASE 
    WHEN parent_id IS NULL THEN 'root'
    ELSE 'child'
  END as level
FROM menu_items
ORDER BY menu_slug, order_index;

-- 4. Header Menu Structure
SELECT 
  i.label,
  i.type,
  i.order_index,
  p.slug as page_slug
FROM content_navigation_items i
LEFT JOIN content_pages p ON i.page_id = p.id
WHERE i.menu_id = 'eefb246b-d868-4a68-8763-aa50602b1d43' -- main-header-menu
  AND i.parent_id IS NULL
ORDER BY i.order_index;

-- 5. Footer Menu Structure (showing hierarchy)
WITH RECURSIVE menu_tree AS (
  -- Root items
  SELECT 
    i.id,
    i.parent_id,
    i.label,
    i.type,
    i.order_index,
    p.slug as page_slug,
    0 as level,
    i.label as path
  FROM content_navigation_items i
  LEFT JOIN content_pages p ON i.page_id = p.id
  WHERE i.menu_id = '5853ecac-66ff-4c29-a533-964be2fa0e76' -- main-footer-menu
    AND i.parent_id IS NULL
  
  UNION ALL
  
  -- Child items
  SELECT 
    i.id,
    i.parent_id,
    i.label,
    i.type,
    i.order_index,
    p.slug as page_slug,
    mt.level + 1,
    mt.path || ' > ' || i.label
  FROM content_navigation_items i
  LEFT JOIN content_pages p ON i.page_id = p.id
  JOIN menu_tree mt ON i.parent_id = mt.id
)
SELECT 
  REPEAT('  ', level) || label as label_hierarchy,
  type,
  page_slug,
  order_index
FROM menu_tree
ORDER BY 
  CASE WHEN level = 0 THEN order_index ELSE 999 END,
  path;

-- 6. Mobile Menu Structure
SELECT 
  i.label,
  i.type,
  i.order_index,
  p.slug as page_slug
FROM content_navigation_items i
LEFT JOIN content_pages p ON i.page_id = p.id
WHERE i.menu_id = '361a2cc4-ec03-47f5-a0fc-356843ba3185' -- main-mobile-menu
  AND i.parent_id IS NULL
ORDER BY i.order_index;

-- 7. Check for any orphaned navigation items
SELECT 
  i.id,
  i.label,
  i.menu_id,
  i.page_id,
  'orphaned page reference' as issue
FROM content_navigation_items i
LEFT JOIN content_pages p ON i.page_id = p.id
WHERE i.page_id IS NOT NULL 
  AND p.id IS NULL
  AND i.menu_id IN (
    SELECT id FROM content_navigation_menus m
    JOIN content_projects proj ON m.project_id = proj.id
    WHERE proj.slug = 'marketing'
  );

-- 8. Summary statistics
SELECT 
  'Total Menus' as metric,
  COUNT(DISTINCT m.id) as count
FROM content_navigation_menus m
JOIN content_projects p ON m.project_id = p.id
WHERE p.slug = 'marketing'

UNION ALL

SELECT 
  'Total Navigation Items' as metric,
  COUNT(DISTINCT i.id) as count
FROM content_navigation_items i
WHERE i.menu_id IN (
  SELECT id FROM content_navigation_menus m
  JOIN content_projects p ON m.project_id = p.id
  WHERE p.slug = 'marketing'
)

UNION ALL

SELECT 
  'Root Level Items' as metric,
  COUNT(DISTINCT i.id) as count
FROM content_navigation_items i
WHERE i.menu_id IN (
  SELECT id FROM content_navigation_menus m
  JOIN content_projects p ON m.project_id = p.id
  WHERE p.slug = 'marketing'
)
AND i.parent_id IS NULL;
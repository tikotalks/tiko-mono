-- Debug script to check marketing website navigation issues
-- Run this to see what pages exist and their navigation settings

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

-- 2. List ALL pages in the marketing project with their navigation settings
SELECT 
    p.id,
    p.slug,
    p.title,
    p.language_code,
    p.is_home,
    p.is_published,
    p.show_in_navigation,
    p.navigation_order,
    p.full_path,
    p.created_at
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
ORDER BY p.language_code, p.navigation_order;

-- 3. Check specifically for English pages that should show in navigation
SELECT 
    p.slug,
    p.title,
    p.language_code,
    p.show_in_navigation,
    p.navigation_order,
    p.is_published,
    p.is_home
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
    AND p.language_code = 'en'
    AND p.show_in_navigation = true
    AND p.is_published = true
    AND p.is_home = false
ORDER BY p.navigation_order;

-- 4. Check if the columns exist on the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'content_pages'
    AND column_name IN ('show_in_navigation', 'navigation_order', 'is_home', 'is_published');

-- 5. Count pages by language
SELECT 
    p.language_code,
    COUNT(*) as total_pages,
    COUNT(CASE WHEN p.show_in_navigation = true THEN 1 END) as nav_pages,
    COUNT(CASE WHEN p.is_published = true THEN 1 END) as published_pages
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
GROUP BY p.language_code;

-- 6. Check for any pages with NULL navigation settings
SELECT 
    p.id,
    p.slug,
    p.title,
    p.show_in_navigation,
    p.navigation_order
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
WHERE proj.slug = 'marketing'
    AND (p.show_in_navigation IS NULL OR p.navigation_order IS NULL);
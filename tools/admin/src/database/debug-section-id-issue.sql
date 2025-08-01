-- Debug query to investigate section_id vs section_template_id issue
-- This query helps understand why the marketing app is showing section_id equal to section_template_id

-- 1. First, let's see what's actually in the content_page_sections table for the home page
SELECT 
    'content_page_sections data' as query_description,
    cps.id,
    cps.page_id,
    cps.section_id,
    cps.section_template_id,
    cps.position,
    cps.is_active,
    cp.slug as page_slug,
    cp.title as page_title
FROM content_page_sections cps
JOIN content_pages cp ON cp.id = cps.page_id
WHERE cp.slug = 'home'
ORDER BY cps.position;

-- 2. Show what section instances actually exist
SELECT 
    'content_section_instances data' as query_description,
    csi.id as instance_id,
    csi.template_id,
    csi.name,
    csi.is_active,
    cst.identifier as template_identifier,
    cst.name as template_name
FROM content_section_instances csi
JOIN content_section_templates cst ON cst.id = csi.template_id
ORDER BY csi.created_at DESC;

-- 3. Compare the IDs to understand the mapping
SELECT 
    'ID Comparison' as query_description,
    cps.id as page_section_id,
    cps.section_id as stored_section_id,
    cps.section_template_id as stored_template_id,
    csi.id as actual_instance_id,
    csi.template_id as instance_template_id,
    cst.identifier as template_identifier,
    CASE 
        WHEN cps.section_id = cps.section_template_id THEN 'ISSUE: section_id equals template_id'
        WHEN cps.section_id != csi.id THEN 'ISSUE: section_id does not match instance_id'
        ELSE 'OK'
    END as status
FROM content_page_sections cps
LEFT JOIN content_section_instances csi ON csi.id = cps.section_id
LEFT JOIN content_section_templates cst ON cst.id = cps.section_template_id
JOIN content_pages cp ON cp.id = cps.page_id
WHERE cp.slug = 'home'
ORDER BY cps.position;

-- 4. Check if there's a mismatch between what's stored and what exists
SELECT 
    'Missing instances check' as query_description,
    cps.section_id,
    cps.section_template_id,
    CASE 
        WHEN csi.id IS NULL THEN 'MISSING: No instance found for section_id ' || cps.section_id
        ELSE 'Instance exists'
    END as instance_status
FROM content_page_sections cps
LEFT JOIN content_section_instances csi ON csi.id = cps.section_id
JOIN content_pages cp ON cp.id = cps.page_id
WHERE cp.slug = 'home';

-- 5. Show the actual data that the marketing app might be querying
-- This simulates what the app might be doing when it loads sections
SELECT 
    'Marketing app query simulation' as query_description,
    cps.id,
    cps.section_id,
    cps.section_template_id,
    cps.position,
    -- What the app might be loading
    COALESCE(csi.id, cps.section_template_id) as resolved_section_id,
    COALESCE(csi.template_id, cps.section_template_id) as resolved_template_id,
    COALESCE(csi.name, cst.name) as section_name,
    cst.identifier,
    cst.schema
FROM content_page_sections cps
LEFT JOIN content_section_instances csi ON csi.id = cps.section_id
LEFT JOIN content_section_templates cst ON cst.id = COALESCE(csi.template_id, cps.section_template_id)
JOIN content_pages cp ON cp.id = cps.page_id
WHERE cp.slug = 'home'
ORDER BY cps.position;

-- 6. Check for any recent updates or modifications
SELECT 
    'Recent modifications' as query_description,
    'content_page_sections' as table_name,
    id,
    section_id,
    section_template_id,
    updated_at
FROM content_page_sections
WHERE page_id IN (SELECT id FROM content_pages WHERE slug = 'home')
AND updated_at > NOW() - INTERVAL '1 day'
ORDER BY updated_at DESC;

-- 7. Verify the fix SQL was applied correctly
SELECT 
    'Verification of fix' as query_description,
    COUNT(*) as total_sections,
    SUM(CASE WHEN section_id = section_template_id THEN 1 ELSE 0 END) as sections_with_matching_ids,
    SUM(CASE WHEN section_id != section_template_id THEN 1 ELSE 0 END) as sections_with_different_ids
FROM content_page_sections
WHERE page_id IN (SELECT id FROM content_pages WHERE slug = 'home');
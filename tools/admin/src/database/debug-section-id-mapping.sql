-- Investigation of the section_id mapping issue
-- The problem: getSection() in content.service.ts is querying content_section_templates instead of content_section_instances

-- 1. Show the actual table structure we need
SELECT 
    'Table Structure Check' as query_description,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('content_section_instances', 'content_section_templates', 'content_page_sections')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. Show how section instances are structured
SELECT 
    'Section Instances Structure' as query_description,
    csi.id as instance_id,
    csi.template_id,
    csi.name as instance_name,
    csi.slug as instance_slug,
    csi.is_active,
    cst.name as template_name,
    cst.identifier as template_identifier
FROM content_section_instances csi
JOIN content_section_templates cst ON cst.id = csi.template_id
ORDER BY csi.created_at DESC
LIMIT 10;

-- 3. Show what the marketing app should be loading
SELECT 
    'What Marketing App Should Load' as query_description,
    cp.slug as page_slug,
    cps.position,
    cps.section_id as stored_section_id,
    cps.section_template_id as stored_template_id,
    -- What should be loaded
    csi.id as instance_id,
    csi.name as instance_name,
    csi.slug as instance_slug,
    csi.template_id as instance_template_id,
    -- Template info
    cst.identifier as template_identifier,
    cst.name as template_name,
    -- Check if the getSection query would find anything
    CASE 
        WHEN csi.id::text = cps.section_id THEN 'OK: Instance exists'
        WHEN cps.section_id = cps.section_template_id THEN 'ERROR: section_id equals template_id'
        ELSE 'ERROR: Instance not found'
    END as status
FROM content_page_sections cps
JOIN content_pages cp ON cp.id = cps.page_id
LEFT JOIN content_section_instances csi ON csi.id = cps.section_id
LEFT JOIN content_section_templates cst ON cst.id = COALESCE(csi.template_id, cps.section_template_id)
WHERE cp.slug = 'home'
ORDER BY cps.position;

-- 4. Simulate what the buggy getSection() method returns
-- This is what's happening: it's querying content_section_templates with the section_id
SELECT 
    'Buggy getSection() Simulation' as query_description,
    cps.section_id as queried_id,
    cst_wrong.id as returned_id,
    cst_wrong.name as returned_name,
    cst_wrong.identifier as returned_identifier,
    'WRONG TABLE!' as issue
FROM content_page_sections cps
JOIN content_pages cp ON cp.id = cps.page_id
LEFT JOIN content_section_templates cst_wrong ON cst_wrong.id = cps.section_id
WHERE cp.slug = 'home'
AND cst_wrong.id IS NOT NULL
ORDER BY cps.position;

-- 5. Show what needs to be fixed in the code
SELECT 
    'Code Fix Required' as query_description,
    'content.service.ts line 610-639' as file_location,
    'getSection() method queries content_section_templates instead of content_section_instances' as issue,
    'Need to create getSectionInstance() method or fix getSection() to query the correct table' as solution;

-- 6. Verify if section_data exists for these instances
SELECT 
    'Section Data Check' as query_description,
    cps.section_id,
    csi.name as section_name,
    COUNT(csd.id) as data_count,
    STRING_AGG(csd.field_key || '=' || LEFT(csd.value::text, 50), ', ' ORDER BY csd.field_key) as sample_data
FROM content_page_sections cps
JOIN content_pages cp ON cp.id = cps.page_id
LEFT JOIN content_section_instances csi ON csi.id = cps.section_id
LEFT JOIN content_section_data csd ON csd.section_id = csi.id
WHERE cp.slug = 'home'
GROUP BY cps.section_id, csi.name
ORDER BY cps.section_id;
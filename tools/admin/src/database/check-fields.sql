-- SQL queries to check if fields are defined in the database

-- 1. Check what fields exist for all section templates
SELECT 
    ct.id as template_id,
    ct.name as template_name,
    ct.slug as template_slug,
    cf.id as field_id,
    cf.field_key,
    cf.label,
    cf.field_type,
    cf.is_required,
    cf.is_translatable,
    cf.order_index
FROM content_section_templates ct
LEFT JOIN content_fields cf ON cf.section_template_id = ct.id
WHERE ct.is_active = true
ORDER BY ct.name, cf.order_index;

-- 2. Check specifically for the Hero, Intro, and Content templates that are on the home page
SELECT 
    ct.name as template_name,
    cf.field_key,
    cf.label,
    cf.field_type
FROM content_section_templates ct
LEFT JOIN content_fields cf ON cf.section_template_id = ct.id
WHERE ct.id IN (
    'e6f30596-1f25-4deb-b067-b5f8902a996b', -- Hero Template
    'cfbc4673-7a0a-4b6a-a107-8fe49edc33b0', -- Intro Template
    '4c00d507-81a5-41a7-b09e-13c86a1a911b'  -- Content Template
)
ORDER BY ct.name, cf.order_index;

-- 3. Check if there are any field values for the home page
SELECT 
    p.title as page_title,
    st.name as section_name,
    cf.field_key,
    cf.label,
    fv.value,
    fv.language_code
FROM content_field_values fv
JOIN content_pages p ON fv.page_id = p.id
JOIN content_section_templates st ON fv.section_template_id = st.id
JOIN content_fields cf ON fv.field_id = cf.id
WHERE p.id = '6b8793ed-ced1-4cbf-9447-185250e562d5' -- Home page ID
ORDER BY st.name, cf.order_index;

-- 4. Check which sections are assigned to the home page
SELECT 
    ps.order_index,
    ps.section_template_id,
    st.name as template_name,
    ps.override_name
FROM content_page_sections ps
JOIN content_section_templates st ON ps.section_template_id = st.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- 5. Check if fields exist for sections currently on the home page
SELECT 
    st.name as template_name,
    COUNT(cf.id) as field_count,
    STRING_AGG(cf.field_key, ', ' ORDER BY cf.order_index) as fields
FROM content_page_sections ps
JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_fields cf ON cf.section_template_id = st.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
GROUP BY st.id, st.name
ORDER BY MIN(ps.order_index);

-- 6. Debug: Check if the content_fields table exists and has data
SELECT 
    COUNT(*) as total_fields,
    COUNT(DISTINCT section_template_id) as templates_with_fields
FROM content_fields;

-- 7. Check for any orphaned field values (values without corresponding field definitions)
SELECT 
    fv.id,
    fv.field_id,
    fv.section_template_id,
    fv.value
FROM content_field_values fv
LEFT JOIN content_fields cf ON fv.field_id = cf.id
WHERE cf.id IS NULL
AND fv.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5';
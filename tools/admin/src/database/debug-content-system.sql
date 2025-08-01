-- Debug queries to check the content system state

-- 1. Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'content_projects',
    'content_section_templates', 
    'content_fields',
    'content_pages',
    'content_page_sections',
    'content_field_values',
    'content_sections',
    'content_section_data'
)
ORDER BY table_name;

-- 2. Check section templates and their fields
SELECT 
    st.id as template_id,
    st.name as template_name,
    COUNT(cf.id) as field_count,
    STRING_AGG(cf.field_key, ', ' ORDER BY cf.order_index) as fields
FROM content_section_templates st
LEFT JOIN content_fields cf ON cf.section_template_id = st.id
WHERE st.is_active = true
GROUP BY st.id, st.name
ORDER BY st.name;

-- 3. Check sections (instances) and their data
SELECT 
    s.id as section_id,
    s.name as section_name,
    s.section_template_id,
    st.name as template_name,
    COUNT(sd.id) as data_count
FROM content_sections s
LEFT JOIN content_section_templates st ON s.section_template_id = st.id
LEFT JOIN content_section_data sd ON sd.section_id = s.id
GROUP BY s.id, s.name, s.section_template_id, st.name
ORDER BY s.name;

-- 4. Check page sections and field values for the home page
SELECT 
    ps.order_index,
    st.name as section_name,
    COUNT(DISTINCT fv.field_id) as field_values_count
FROM content_page_sections ps
JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_field_values fv ON fv.page_id = ps.page_id AND fv.section_template_id = ps.section_template_id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5' -- Home page
GROUP BY ps.order_index, st.name
ORDER BY ps.order_index;

-- 5. Check section data for a specific section (if you have a section ID)
-- Replace 'section-id-here' with an actual section ID
/*
SELECT 
    sd.field_key,
    sd.value,
    sd.language_code
FROM content_section_data sd
WHERE sd.section_id = 'section-id-here'
ORDER BY sd.field_key;
*/

-- 6. Quick check: Do we have the content_section_data table?
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_section_data'
) as section_data_table_exists;
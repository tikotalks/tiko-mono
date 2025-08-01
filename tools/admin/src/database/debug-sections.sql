-- Debug: Check section instances and page sections

-- 1. Check what section instances exist
SELECT 
    s.id as section_id,
    s.name as section_name,
    s.section_template_id,
    st.name as template_name,
    s.language_code
FROM content_sections s
JOIN content_section_templates st ON s.section_template_id = st.id
ORDER BY s.name;

-- 2. Check what's in page_sections for the home page
SELECT 
    ps.*,
    st.name as template_name,
    s.name as section_name
FROM content_page_sections ps
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
LEFT JOIN content_sections s ON ps.section_id = s.id
WHERE ps.page_id = '6b8793ed-ced1-4cbf-9447-185250e562d5'
ORDER BY ps.order_index;

-- 3. Check section data for any "Apps" section
SELECT 
    s.name as section_name,
    sd.*
FROM content_section_data sd
JOIN content_sections s ON sd.section_id = s.id
WHERE s.name LIKE '%Apps%' OR s.name LIKE '%app%'
ORDER BY s.name, sd.field_key;
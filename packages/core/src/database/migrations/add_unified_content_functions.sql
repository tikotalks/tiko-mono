-- ============================================================================
-- Unified Content API - Database Functions
-- ============================================================================
-- 
-- Optimized database functions for the new unified content API
-- These functions perform joins at the database level for better performance
--

-- ============================================================================
-- Function: get_page_with_sections
-- Purpose: Get page data with all sections in a single optimized query
-- ============================================================================

CREATE OR REPLACE FUNCTION get_page_with_sections(input_page_id UUID)
RETURNS TABLE(
  -- Page fields
  page_id UUID,
  page_name VARCHAR,
  page_slug VARCHAR,
  project_id UUID,
  page_created_at TIMESTAMPTZ,
  page_updated_at TIMESTAMPTZ,
  
  -- Section fields
  section_id UUID,
  section_name VARCHAR,
  section_slug VARCHAR,
  section_template_id UUID,
  order_index INTEGER,
  override_name VARCHAR,
  
  -- Template fields
  template_name VARCHAR,
  component_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Page data
    p.id as page_id,
    p.name as page_name,
    p.slug as page_slug,
    p.project_id,
    p.created_at as page_created_at,
    p.updated_at as page_updated_at,
    
    -- Section data
    s.id as section_id,
    s.name as section_name,
    s.slug as section_slug,
    s.section_template_id,
    ps.order_index,
    ps.override_name,
    
    -- Template data
    st.name as template_name,
    st.component_type
    
  FROM content_pages p
  LEFT JOIN content_page_sections ps ON p.id = ps.page_id
  LEFT JOIN content_sections s ON ps.section_id = s.id
  LEFT JOIN content_section_templates st ON s.section_template_id = st.id
  WHERE p.id = input_page_id
  ORDER BY ps.order_index ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: get_page_with_full_content
-- Purpose: Get page with sections, content, fields, and linked items
-- ============================================================================

CREATE OR REPLACE FUNCTION get_page_with_full_content(
  input_page_id UUID,
  input_language_code VARCHAR DEFAULT 'en'
)
RETURNS TABLE(
  -- Page fields
  page_id UUID,
  page_name VARCHAR,
  page_slug VARCHAR,
  project_id UUID,
  page_created_at TIMESTAMPTZ,
  page_updated_at TIMESTAMPTZ,
  
  -- Section fields
  section_id UUID,
  section_name VARCHAR,
  section_slug VARCHAR,
  section_template_id UUID,
  order_index INTEGER,
  override_name VARCHAR,
  
  -- Template fields
  template_name VARCHAR,
  component_type VARCHAR,
  
  -- Content fields
  field_key VARCHAR,
  field_value TEXT,
  field_type VARCHAR,
  field_language VARCHAR,
  is_translatable BOOLEAN,
  field_config JSONB,
  
  -- Linked items (as JSON array)
  linked_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH page_sections AS (
    SELECT 
      p.id as page_id,
      p.name as page_name,
      p.slug as page_slug,
      p.project_id,
      p.created_at as page_created_at,
      p.updated_at as page_updated_at,
      s.id as section_id,
      s.name as section_name,
      s.slug as section_slug,
      s.section_template_id,
      ps.order_index,
      ps.override_name,
      st.name as template_name,
      st.component_type
    FROM content_pages p
    LEFT JOIN content_page_sections ps ON p.id = ps.page_id
    LEFT JOIN content_sections s ON ps.section_id = s.id
    LEFT JOIN content_section_templates st ON s.section_template_id = st.id
    WHERE p.id = input_page_id
  ),
  section_content AS (
    SELECT 
      ps.*,
      sd.field_key,
      sd.value as field_value,
      sd.language_code as field_language,
      f.field_type,
      f.is_translatable,
      f.config as field_config
    FROM page_sections ps
    LEFT JOIN content_section_data sd ON ps.section_id = sd.section_id
    LEFT JOIN content_fields f ON f.section_template_id = ps.section_template_id 
      AND f.field_key = sd.field_key
    WHERE (sd.language_code = input_language_code 
           OR sd.language_code IS NULL 
           OR sd.language_code = 'en')
  ),
  linked_items_agg AS (
    SELECT 
      sli.section_id,
      sli.field_id,
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'name', i.name,
          'slug', i.slug,
          'item_template_id', i.item_template_id,
          'sort_order', sli.sort_order
        ) ORDER BY sli.sort_order
      ) as linked_items
    FROM content_section_linked_items sli
    JOIN content_items i ON sli.item_id = i.id
    GROUP BY sli.section_id, sli.field_id
  )
  SELECT 
    sc.*,
    lia.linked_items
  FROM section_content sc
  LEFT JOIN linked_items_agg lia ON sc.section_id = lia.section_id
  ORDER BY sc.order_index ASC NULLS LAST, sc.field_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: get_section_with_full_content
-- Purpose: Get single section with all content and linked items
-- ============================================================================

CREATE OR REPLACE FUNCTION get_section_with_full_content(
  input_section_id UUID,
  input_language_code VARCHAR DEFAULT 'en'
)
RETURNS TABLE(
  -- Section fields
  section_id UUID,
  section_name VARCHAR,
  section_slug VARCHAR,
  section_template_id UUID,
  
  -- Template fields
  template_name VARCHAR,
  component_type VARCHAR,
  
  -- Content fields
  field_key VARCHAR,
  field_value TEXT,
  field_type VARCHAR,
  field_language VARCHAR,
  is_translatable BOOLEAN,
  field_config JSONB,
  
  -- Linked items
  linked_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH section_data AS (
    SELECT 
      s.id as section_id,
      s.name as section_name,
      s.slug as section_slug,
      s.section_template_id,
      st.name as template_name,
      st.component_type
    FROM content_sections s
    LEFT JOIN content_section_templates st ON s.section_template_id = st.id
    WHERE s.id = input_section_id
  ),
  section_content AS (
    SELECT 
      sd.*,
      sd.field_key,
      sd.value as field_value,
      sd.language_code as field_language,
      f.field_type,
      f.is_translatable,
      f.config as field_config
    FROM section_data sd_base
    LEFT JOIN content_section_data sd ON sd_base.section_id = sd.section_id
    LEFT JOIN content_fields f ON f.section_template_id = sd_base.section_template_id 
      AND f.field_key = sd.field_key
    WHERE (sd.language_code = input_language_code 
           OR sd.language_code IS NULL 
           OR sd.language_code = 'en')
  ),
  linked_items_agg AS (
    SELECT 
      sli.section_id,
      sli.field_id,
      jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'name', i.name,
          'slug', i.slug,
          'item_template_id', i.item_template_id,
          'sort_order', sli.sort_order
        ) ORDER BY sli.sort_order
      ) as linked_items
    FROM content_section_linked_items sli
    JOIN content_items i ON sli.item_id = i.id
    WHERE sli.section_id = input_section_id
    GROUP BY sli.section_id, sli.field_id
  )
  SELECT 
    sc.section_id,
    sc.section_name,
    sc.section_slug,
    sc.section_template_id,
    sc.template_name,
    sc.component_type,
    sc.field_key,
    sc.field_value,
    sc.field_type,
    sc.field_language,
    sc.is_translatable,
    sc.field_config,
    lia.linked_items
  FROM section_content sc
  LEFT JOIN linked_items_agg lia ON sc.section_id = lia.section_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: get_items_by_section
-- Purpose: Get all items linked to a section with content
-- ============================================================================

CREATE OR REPLACE FUNCTION get_items_by_section(
  input_section_id UUID,
  input_language_code VARCHAR DEFAULT 'en'
)
RETURNS TABLE(
  item_id UUID,
  item_name VARCHAR,
  item_slug VARCHAR,
  item_template_id UUID,
  sort_order INTEGER,
  field_key VARCHAR,
  field_value TEXT,
  field_type VARCHAR,
  item_language VARCHAR,
  is_translatable BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.name as item_name,
    i.slug as item_slug,
    i.item_template_id,
    sli.sort_order,
    f.field_key,
    id_data.value as field_value,
    f.field_type,
    i.language_code as item_language,
    f.is_translatable
  FROM content_section_linked_items sli
  JOIN content_items i ON sli.item_id = i.id
  LEFT JOIN content_item_data id_data ON i.id = id_data.item_id
  LEFT JOIN content_fields f ON f.id = id_data.field_id
  WHERE sli.section_id = input_section_id
    AND (i.language_code = input_language_code 
         OR i.language_code IS NULL 
         OR i.language_code = 'en')
  ORDER BY sli.sort_order, f.field_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: get_item_with_content
-- Purpose: Get single item with all its content
-- ============================================================================

CREATE OR REPLACE FUNCTION get_item_with_content(
  input_item_id UUID,
  input_language_code VARCHAR DEFAULT 'en'
)
RETURNS TABLE(
  item_id UUID,
  item_name VARCHAR,
  item_slug VARCHAR,
  item_template_id UUID,
  field_key VARCHAR,
  field_value TEXT,
  field_type VARCHAR,
  item_language VARCHAR,
  is_translatable BOOLEAN,
  field_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as item_id,
    i.name as item_name,
    i.slug as item_slug,
    i.item_template_id,
    f.field_key,
    id_data.value as field_value,
    f.field_type,
    i.language_code as item_language,
    f.is_translatable,
    f.config as field_config
  FROM content_items i
  LEFT JOIN content_item_data id_data ON i.id = id_data.item_id
  LEFT JOIN content_fields f ON f.id = id_data.field_id
  WHERE i.id = input_item_id
    AND (i.language_code = input_language_code 
         OR i.language_code IS NULL 
         OR i.language_code = 'en')
  ORDER BY f.field_key;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create indexes for better performance
-- ============================================================================

-- Index for page sections lookup
CREATE INDEX IF NOT EXISTS idx_content_page_sections_page_order 
ON content_page_sections (page_id, order_index);

-- Index for section content with language
CREATE INDEX IF NOT EXISTS idx_content_section_data_section_lang 
ON content_section_data (section_id, language_code);

-- Index for item content with language
CREATE INDEX IF NOT EXISTS idx_content_item_data_item_lang 
ON content_item_data (item_id, language_code);

-- Index for linked items by section
CREATE INDEX IF NOT EXISTS idx_content_section_linked_items_section_order 
ON content_section_linked_items (section_id, sort_order);

-- Index for fields by template
CREATE INDEX IF NOT EXISTS idx_content_fields_template_key 
ON content_fields (section_template_id, field_key);

CREATE INDEX IF NOT EXISTS idx_content_fields_item_template_key 
ON content_fields (item_template_id, field_key);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON FUNCTION get_page_with_sections(UUID) IS 
'Optimized function to get page with all sections using single query with joins';

COMMENT ON FUNCTION get_page_with_full_content(UUID, VARCHAR) IS 
'Get complete page content including sections, fields, and linked items in one call';

COMMENT ON FUNCTION get_section_with_full_content(UUID, VARCHAR) IS 
'Get complete section content including fields and linked items in one call';

COMMENT ON FUNCTION get_items_by_section(UUID, VARCHAR) IS 
'Get all items linked to a section with their content data';

COMMENT ON FUNCTION get_item_with_content(UUID, VARCHAR) IS 
'Get single item with all its content data in preferred language';
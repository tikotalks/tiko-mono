-- Content Management System Database Schema
-- This creates a flexible content management system with multilingual support

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================== PROJECTS ===================
-- Projects represent different websites or apps
CREATE TABLE IF NOT EXISTS content_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  languages TEXT[] NOT NULL DEFAULT '{}',
  default_language TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_default_language CHECK (default_language = ANY(languages))
);

-- =================== SECTION TEMPLATES ===================
-- Reusable section definitions that can be global or language-specific
CREATE TABLE IF NOT EXISTS content_section_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  language_code TEXT, -- NULL means global/all languages
  component_type TEXT NOT NULL, -- hero, text, media, etc.
  is_reusable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, language_code)
);

-- =================== FIELDS ===================
-- Field definitions for sections
CREATE TABLE IF NOT EXISTS content_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_template_id UUID NOT NULL REFERENCES content_section_templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'richtext', 'number', 'boolean', 'select', 'media', 'media_list', 'list', 'object')),
  is_required BOOLEAN DEFAULT false,
  is_translatable BOOLEAN DEFAULT true,
  default_value JSONB,
  validation_rules JSONB,
  config JSONB, -- For select options, list fields structure, etc.
  order_index INTEGER DEFAULT 0,
  UNIQUE(section_template_id, field_key)
);

-- =================== PAGE TEMPLATES ===================
-- Templates for creating pages with predefined structure
CREATE TABLE IF NOT EXISTS content_page_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  default_sections UUID[], -- Array of section_template IDs
  page_fields JSONB, -- Page-level fields like theme, layout
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, slug)
);

-- =================== PAGES ===================
-- Actual pages in projects
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES content_projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES content_page_templates(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  full_path TEXT NOT NULL,
  is_home BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  page_data JSONB DEFAULT '{}', -- Page-level data like theme, layout
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE(project_id, language_code, slug),
  UNIQUE(project_id, language_code, full_path)
);

-- Create a partial unique index to ensure only one home page per project/language
CREATE UNIQUE INDEX idx_unique_home_page ON content_pages (project_id, language_code) WHERE is_home = true;

-- =================== PAGE SECTIONS ===================
-- Many-to-many relationship between pages and section templates
CREATE TABLE IF NOT EXISTS content_page_sections (
  page_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
  section_template_id UUID NOT NULL REFERENCES content_section_templates(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  override_name TEXT, -- Optional override for section name on this page
  PRIMARY KEY (page_id, section_template_id)
);

-- =================== FIELD VALUES ===================
-- Actual content values for fields
CREATE TABLE IF NOT EXISTS content_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
  section_template_id UUID REFERENCES content_section_templates(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, section_template_id, field_id, language_code)
);

-- =================== INDEXES ===================
CREATE INDEX idx_content_projects_slug ON content_projects(slug);
CREATE INDEX idx_content_projects_active ON content_projects(is_active);

CREATE INDEX idx_content_section_templates_slug ON content_section_templates(slug);
CREATE INDEX idx_content_section_templates_language ON content_section_templates(language_code);
CREATE INDEX idx_content_section_templates_active ON content_section_templates(is_active);

CREATE INDEX idx_content_fields_section ON content_fields(section_template_id);
CREATE INDEX idx_content_fields_order ON content_fields(order_index);

CREATE INDEX idx_content_pages_project ON content_pages(project_id);
CREATE INDEX idx_content_pages_parent ON content_pages(parent_id);
CREATE INDEX idx_content_pages_language ON content_pages(language_code);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_full_path ON content_pages(full_path);
CREATE INDEX idx_content_pages_published ON content_pages(is_published);

CREATE INDEX idx_content_page_sections_page ON content_page_sections(page_id);
CREATE INDEX idx_content_page_sections_order ON content_page_sections(order_index);

CREATE INDEX idx_content_field_values_page ON content_field_values(page_id);
CREATE INDEX idx_content_field_values_field ON content_field_values(field_id);
CREATE INDEX idx_content_field_values_language ON content_field_values(language_code);

-- =================== TRIGGERS ===================
-- Validate page language is in project's languages
CREATE OR REPLACE FUNCTION validate_page_language()
RETURNS TRIGGER AS $$
DECLARE
  project_languages TEXT[];
BEGIN
  SELECT languages INTO project_languages FROM content_projects WHERE id = NEW.project_id;
  
  IF NOT (NEW.language_code = ANY(project_languages)) THEN
    RAISE EXCEPTION 'Language % is not configured for this project', NEW.language_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_page_language_trigger BEFORE INSERT OR UPDATE ON content_pages
  FOR EACH ROW EXECUTE FUNCTION validate_page_language();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_projects_updated_at BEFORE UPDATE ON content_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_section_templates_updated_at BEFORE UPDATE ON content_section_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_page_templates_updated_at BEFORE UPDATE ON content_page_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at BEFORE UPDATE ON content_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_field_values_updated_at BEFORE UPDATE ON content_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate full_path for pages
CREATE OR REPLACE FUNCTION generate_page_full_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.full_path = '/' || NEW.slug;
  ELSE
    SELECT full_path INTO parent_path FROM content_pages WHERE id = NEW.parent_id;
    NEW.full_path = parent_path || '/' || NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_page_full_path_trigger BEFORE INSERT OR UPDATE OF slug, parent_id ON content_pages
  FOR EACH ROW EXECUTE FUNCTION generate_page_full_path();

-- Update child paths when parent path changes
CREATE OR REPLACE FUNCTION update_child_page_paths()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.full_path IS DISTINCT FROM NEW.full_path THEN
    UPDATE content_pages
    SET full_path = NEW.full_path || substring(full_path from length(OLD.full_path) + 1)
    WHERE parent_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_child_page_paths_trigger AFTER UPDATE OF full_path ON content_pages
  FOR EACH ROW EXECUTE FUNCTION update_child_page_paths();

-- =================== ROW LEVEL SECURITY ===================
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_field_values ENABLE ROW LEVEL SECURITY;

-- Public users can view published content
CREATE POLICY "Public users can view active projects"
  ON content_projects FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public users can view active section templates"
  ON content_section_templates FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public users can view fields"
  ON content_fields FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public users can view published pages"
  ON content_pages FOR SELECT
  TO public
  USING (is_published = true);

CREATE POLICY "Public users can view page sections"
  ON content_page_sections FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM content_pages 
    WHERE id = page_id AND is_published = true
  ));

CREATE POLICY "Public users can view field values"
  ON content_field_values FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM content_pages 
    WHERE id = page_id AND is_published = true
  ));

-- Authenticated users have broader access
CREATE POLICY "Authenticated users can manage content"
  ON content_projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage section templates"
  ON content_section_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage fields"
  ON content_fields FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage page templates"
  ON content_page_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage pages"
  ON content_pages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage page sections"
  ON content_page_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage field values"
  ON content_field_values FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =================== HELPER VIEWS ===================
-- View to get pages with their sections and fields
CREATE OR REPLACE VIEW content_page_details AS
SELECT 
  p.id,
  p.project_id,
  p.language_code,
  p.slug,
  p.title,
  p.full_path,
  p.is_published,
  p.page_data,
  proj.name as project_name,
  proj.slug as project_slug,
  COALESCE(
    json_agg(
      json_build_object(
        'section_id', st.id,
        'section_name', COALESCE(ps.override_name, st.name),
        'section_slug', st.slug,
        'component_type', st.component_type,
        'order_index', ps.order_index
      ) ORDER BY ps.order_index
    ) FILTER (WHERE st.id IS NOT NULL),
    '[]'::json
  ) as sections
FROM content_pages p
JOIN content_projects proj ON p.project_id = proj.id
LEFT JOIN content_page_sections ps ON p.id = ps.page_id
LEFT JOIN content_section_templates st ON ps.section_template_id = st.id
  AND (st.language_code IS NULL OR st.language_code = p.language_code)
GROUP BY p.id, proj.id;

-- Comments for documentation
COMMENT ON TABLE content_projects IS 'Projects represent different websites or applications';
COMMENT ON TABLE content_section_templates IS 'Reusable section templates that can be global or language-specific';
COMMENT ON TABLE content_fields IS 'Field definitions for section templates';
COMMENT ON TABLE content_page_templates IS 'Page templates with predefined structure';
COMMENT ON TABLE content_pages IS 'Actual pages with content';
COMMENT ON TABLE content_page_sections IS 'Many-to-many relationship between pages and sections';
COMMENT ON TABLE content_field_values IS 'Actual content values for fields';

COMMENT ON COLUMN content_section_templates.language_code IS 'NULL means this section is available for all languages';
COMMENT ON COLUMN content_pages.is_home IS 'Only one page per project/language can be the home page';
COMMENT ON COLUMN content_fields.is_translatable IS 'Whether this field should have different values per language';
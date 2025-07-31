-- =================== CONTENT SECTIONS (INSTANCES) ===================
-- This table stores pre-configured section instances that can be added to pages
-- These are NOT templates, but actual sections with pre-filled content

CREATE TABLE IF NOT EXISTS content_sections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_template_id UUID NOT NULL REFERENCES content_section_templates(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  language_code VARCHAR(10),
  project_id UUID REFERENCES content_projects(id) ON DELETE CASCADE,
  is_reusable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language_code, project_id)
);

-- Content data for section instances
CREATE TABLE IF NOT EXISTS content_section_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(section_id, field_id)
);

-- Indexes
CREATE INDEX idx_content_sections_template ON content_sections(section_template_id);
CREATE INDEX idx_content_sections_project ON content_sections(project_id);
CREATE INDEX idx_content_sections_language ON content_sections(language_code);
CREATE INDEX idx_content_sections_active ON content_sections(is_active);
CREATE INDEX idx_content_section_data_section ON content_section_data(section_id);

-- Row Level Security
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_section_data ENABLE ROW LEVEL SECURITY;

-- Public users can view active sections
CREATE POLICY "Public users can view active sections"
  ON content_sections FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Public users can view section data"
  ON content_section_data FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM content_sections 
    WHERE id = section_id AND is_active = true
  ));

-- Authenticated users can manage sections
CREATE POLICY "Authenticated users can manage sections"
  ON content_sections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage section data"
  ON content_section_data FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger
CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE ON content_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_section_data_updated_at BEFORE UPDATE ON content_section_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================== SAMPLE DATA ===================
-- Insert some example section instances

-- Hero Section Instance for Homepage
INSERT INTO content_sections (section_template_id, name, slug, description, is_reusable, is_active)
VALUES (
  (SELECT id FROM content_section_templates WHERE slug = 'hero' LIMIT 1),
  'Homepage Hero',
  'homepage-hero',
  'Main hero section for the homepage with welcome message',
  false,
  true
);

-- Features Section Instance
INSERT INTO content_sections (section_template_id, name, slug, description, is_reusable, is_active)
VALUES (
  (SELECT id FROM content_section_templates WHERE slug = 'features' LIMIT 1),
  'Product Features',
  'product-features',
  'Reusable features section highlighting product capabilities',
  true,
  true
);

-- CTA Section Instance
INSERT INTO content_sections (section_template_id, name, slug, description, is_reusable, is_active)
VALUES (
  (SELECT id FROM content_section_templates WHERE slug = 'cta' LIMIT 1),
  'Newsletter Signup CTA',
  'newsletter-cta',
  'Call to action for newsletter signup',
  true,
  true
);
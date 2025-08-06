-- Complete Content System Migration
-- Run this if you don't have the content tables yet

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create field_type enum
CREATE TYPE field_type AS ENUM (
  'text',
  'textarea',
  'richtext',
  'number',
  'boolean',
  'select',
  'options',
  'media',
  'date',
  'list',
  'items',
  'linked_items'
);

-- Create section_templates table
CREATE TABLE IF NOT EXISTS section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create item_templates table
CREATE TABLE IF NOT EXISTS item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_template_id UUID REFERENCES section_templates(id) ON DELETE CASCADE,
  item_template_id UUID REFERENCES item_templates(id) ON DELETE CASCADE,
  field_key VARCHAR NOT NULL,
  label VARCHAR NOT NULL,
  field_type field_type NOT NULL,
  is_required BOOLEAN DEFAULT false,
  is_translatable BOOLEAN DEFAULT true,
  default_value TEXT,
  config JSONB,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_template_reference CHECK (
    (section_template_id IS NOT NULL AND item_template_id IS NULL) OR 
    (section_template_id IS NULL AND item_template_id IS NOT NULL)
  ),
  CONSTRAINT unique_section_field_key UNIQUE(section_template_id, field_key),
  CONSTRAINT unique_item_field_key UNIQUE(item_template_id, field_key)
);

-- Create sections table
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_template_id UUID NOT NULL REFERENCES section_templates(id) ON DELETE RESTRICT,
  name VARCHAR NOT NULL,
  slug VARCHAR,
  description TEXT,
  language_code VARCHAR(10),
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create section_data table
CREATE TABLE IF NOT EXISTS section_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_field UNIQUE(section_id, field_id)
);

-- Create items table with translation support
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_template_id UUID NOT NULL REFERENCES item_templates(id) ON DELETE RESTRICT,
  name VARCHAR NOT NULL,
  slug VARCHAR,
  language_code VARCHAR(10), -- null for base items
  base_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_translation UNIQUE (base_item_id, language_code),
  CONSTRAINT check_base_item CHECK (
    (language_code IS NULL AND base_item_id IS NULL) OR 
    (language_code IS NOT NULL AND base_item_id IS NOT NULL)
  )
);

-- Create item_data table
CREATE TABLE IF NOT EXISTS item_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_field UNIQUE(item_id, field_id)
);

-- Create linked_items junction table
CREATE TABLE IF NOT EXISTS section_linked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_field_item UNIQUE(section_id, field_id, item_id)
);

-- Create indexes for performance
CREATE INDEX idx_fields_section_template ON fields(section_template_id);
CREATE INDEX idx_fields_item_template ON fields(item_template_id);
CREATE INDEX idx_sections_template ON sections(section_template_id);
CREATE INDEX idx_sections_language ON sections(language_code);
CREATE INDEX idx_section_data_section ON section_data(section_id);
CREATE INDEX idx_section_data_field ON section_data(field_id);
CREATE INDEX idx_items_template ON items(item_template_id);
CREATE INDEX idx_items_base ON items(base_item_id);
CREATE INDEX idx_items_language ON items(language_code);
CREATE INDEX idx_items_slug ON items(slug);
CREATE INDEX idx_item_data_item ON item_data(item_id);
CREATE INDEX idx_item_data_field ON item_data(field_id);
CREATE INDEX idx_section_linked_items_section ON section_linked_items(section_id);
CREATE INDEX idx_section_linked_items_item ON section_linked_items(item_id);

-- Enable RLS
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_linked_items ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view section templates" ON section_templates
  FOR SELECT USING (true);

CREATE POLICY "Public can view item templates" ON item_templates
  FOR SELECT USING (true);

CREATE POLICY "Public can view fields" ON fields
  FOR SELECT USING (true);

CREATE POLICY "Public can view active sections" ON sections
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view section data" ON section_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections 
      WHERE sections.id = section_data.section_id 
      AND sections.is_active = true
    )
  );

CREATE POLICY "Public can view active items" ON items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view item data" ON item_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM items 
      WHERE items.id = item_data.item_id 
      AND items.is_active = true
    )
  );

CREATE POLICY "Public can view linked items" ON section_linked_items
  FOR SELECT USING (true);

-- Admin policies (authenticated users can manage)
CREATE POLICY "Authenticated can manage section templates" ON section_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage item templates" ON item_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage fields" ON fields
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage sections" ON sections
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage section data" ON section_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage items" ON items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage item data" ON item_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage linked items" ON section_linked_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE TRIGGER update_section_templates_updated_at
  BEFORE UPDATE ON section_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_templates_updated_at
  BEFORE UPDATE ON item_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_section_data_updated_at
  BEFORE UPDATE ON section_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_item_data_updated_at
  BEFORE UPDATE ON item_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
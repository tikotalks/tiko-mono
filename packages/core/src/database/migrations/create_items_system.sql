-- Migration: Create Items System
-- Description: Add tables and relationships for content items with translation support

-- Add is_translatable field to fields table
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS is_translatable BOOLEAN DEFAULT true;

-- Add linked_items field type
DO $$ BEGIN
  ALTER TYPE field_type ADD VALUE IF NOT EXISTS 'linked_items';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create item_templates table (mirrors section_templates)
CREATE TABLE IF NOT EXISTS item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Create indexes for performance
CREATE INDEX idx_items_template ON items(item_template_id);
CREATE INDEX idx_items_base ON items(base_item_id);
CREATE INDEX idx_items_language ON items(language_code);
CREATE INDEX idx_items_slug ON items(slug);

-- Create item_data table for storing field values
CREATE TABLE IF NOT EXISTS item_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_field UNIQUE(item_id, field_id)
);

-- Create indexes for item_data
CREATE INDEX idx_item_data_item ON item_data(item_id);
CREATE INDEX idx_item_data_field ON item_data(field_id);

-- Create linked_items junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS section_linked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_field_item UNIQUE(section_id, field_id, item_id)
);

-- Create indexes for linked items
CREATE INDEX idx_section_linked_items_section ON section_linked_items(section_id);
CREATE INDEX idx_section_linked_items_item ON section_linked_items(item_id);

-- Add RLS policies
ALTER TABLE item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_linked_items ENABLE ROW LEVEL SECURITY;

-- Public read access for templates and active items
CREATE POLICY "Public can view item templates" ON item_templates
  FOR SELECT USING (true);

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
CREATE POLICY "Authenticated can manage item templates" ON item_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage items" ON items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage item data" ON item_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage linked items" ON section_linked_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE TRIGGER update_item_templates_updated_at
  BEFORE UPDATE ON item_templates
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
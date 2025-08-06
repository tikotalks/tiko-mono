-- Add Items System to Existing Content Tables
-- This migration assumes you already have content_section_templates, content_fields, etc.

-- Add is_translatable to content_fields if it doesn't exist
ALTER TABLE content_fields 
ADD COLUMN IF NOT EXISTS is_translatable BOOLEAN DEFAULT true;

-- Add linked_items to field_type enum if it doesn't exist
DO $$ BEGIN
  ALTER TYPE field_type ADD VALUE IF NOT EXISTS 'linked_items';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create content_item_templates table
CREATE TABLE IF NOT EXISTS content_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add item_template_id to content_fields
ALTER TABLE content_fields 
ADD COLUMN IF NOT EXISTS item_template_id UUID REFERENCES content_item_templates(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_content_fields_item_template ON content_fields(item_template_id);

-- Update the constraint to allow either section_template_id OR item_template_id
ALTER TABLE content_fields DROP CONSTRAINT IF EXISTS check_template_reference;
ALTER TABLE content_fields ADD CONSTRAINT check_template_reference CHECK (
  (section_template_id IS NOT NULL AND item_template_id IS NULL) OR 
  (section_template_id IS NULL AND item_template_id IS NOT NULL)
);

-- Create content_items table with translation support
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_template_id UUID NOT NULL REFERENCES content_item_templates(id) ON DELETE RESTRICT,
  name VARCHAR NOT NULL,
  slug VARCHAR,
  language_code VARCHAR(10), -- null for base items
  base_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
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
CREATE INDEX idx_content_items_template ON content_items(item_template_id);
CREATE INDEX idx_content_items_base ON content_items(base_item_id);
CREATE INDEX idx_content_items_language ON content_items(language_code);
CREATE INDEX idx_content_items_slug ON content_items(slug);

-- Create content_item_data table for storing field values
CREATE TABLE IF NOT EXISTS content_item_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_field UNIQUE(item_id, field_id)
);

-- Create indexes for item_data
CREATE INDEX idx_content_item_data_item ON content_item_data(item_id);
CREATE INDEX idx_content_item_data_field ON content_item_data(field_id);

-- Create linked_items junction table for many-to-many relationships
CREATE TABLE IF NOT EXISTS content_section_linked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_field_item UNIQUE(section_id, field_id, item_id)
);

-- Create indexes for linked items
CREATE INDEX idx_content_section_linked_items_section ON content_section_linked_items(section_id);
CREATE INDEX idx_content_section_linked_items_item ON content_section_linked_items(item_id);

-- Add RLS policies
ALTER TABLE content_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_item_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_section_linked_items ENABLE ROW LEVEL SECURITY;

-- Public read access for templates and active items
CREATE POLICY "Public can view item templates" ON content_item_templates
  FOR SELECT USING (true);

CREATE POLICY "Public can view active items" ON content_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view item data" ON content_item_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_items 
      WHERE content_items.id = content_item_data.item_id 
      AND content_items.is_active = true
    )
  );

CREATE POLICY "Public can view linked items" ON content_section_linked_items
  FOR SELECT USING (true);

-- Admin policies (authenticated users can manage)
CREATE POLICY "Authenticated can manage item templates" ON content_item_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage items" ON content_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage item data" ON content_item_data
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage linked items" ON content_section_linked_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at triggers (assuming update_updated_at_column() exists)
CREATE TRIGGER update_content_item_templates_updated_at
  BEFORE UPDATE ON content_item_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_item_data_updated_at
  BEFORE UPDATE ON content_item_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
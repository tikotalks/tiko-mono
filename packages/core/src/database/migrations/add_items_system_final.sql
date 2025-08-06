-- Items System Migration for Existing Content Tables
-- This migration is based on your actual schema

-- First, update the field_type CHECK constraint to include 'linked_items'
ALTER TABLE content_fields DROP CONSTRAINT IF EXISTS content_fields_field_type_check;
ALTER TABLE content_fields ADD CONSTRAINT content_fields_field_type_check 
CHECK (field_type = ANY (ARRAY[
  'text'::text, 'textarea'::text, 'richtext'::text, 
  'number'::text, 'boolean'::text, 'select'::text, 
  'options'::text, 'items'::text, 'media'::text, 
  'media_list'::text, 'list'::text, 'object'::text,
  'linked_items'::text  -- Added for linking to items
]));

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
DO $$
BEGIN
    -- First, make section_template_id nullable if it isn't already
    ALTER TABLE content_fields ALTER COLUMN section_template_id DROP NOT NULL;
    
    -- Drop existing constraint if it exists
    ALTER TABLE content_fields DROP CONSTRAINT IF EXISTS check_template_reference;
    
    -- Add new constraint
    ALTER TABLE content_fields ADD CONSTRAINT check_template_reference CHECK (
        (section_template_id IS NOT NULL AND item_template_id IS NULL) OR 
        (section_template_id IS NULL AND item_template_id IS NOT NULL)
    );
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not update constraint: %', SQLERRM;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_content_items_template ON content_items(item_template_id);
CREATE INDEX IF NOT EXISTS idx_content_items_base ON content_items(base_item_id);
CREATE INDEX IF NOT EXISTS idx_content_items_language ON content_items(language_code);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON content_items(slug);

-- Create content_item_data table (similar to content_section_data)
CREATE TABLE IF NOT EXISTS content_item_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_item_field UNIQUE(item_id, field_id)
);

-- Create indexes for item_data
CREATE INDEX IF NOT EXISTS idx_content_item_data_item ON content_item_data(item_id);
CREATE INDEX IF NOT EXISTS idx_content_item_data_field ON content_item_data(field_id);

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
CREATE INDEX IF NOT EXISTS idx_content_section_linked_items_section ON content_section_linked_items(section_id);
CREATE INDEX IF NOT EXISTS idx_content_section_linked_items_item ON content_section_linked_items(item_id);

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

-- Create updated_at triggers
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Items system migration completed successfully!';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - content_item_templates';
    RAISE NOTICE '  - content_items';
    RAISE NOTICE '  - content_item_data';
    RAISE NOTICE '  - content_section_linked_items';
    RAISE NOTICE 'Field type "linked_items" added to content_fields CHECK constraint';
END $$;
-- Clean Items System Migration
-- This migration safely adds the items system, checking for existing objects

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies for content_item_templates
    DROP POLICY IF EXISTS "Public can view item templates" ON content_item_templates;
    DROP POLICY IF EXISTS "Authenticated users can manage item templates" ON content_item_templates;
    
    -- Drop policies for content_items
    DROP POLICY IF EXISTS "Public can view active items" ON content_items;
    DROP POLICY IF EXISTS "Authenticated users can manage items" ON content_items;
    
    -- Drop policies for content_item_data
    DROP POLICY IF EXISTS "Users can view item data" ON content_item_data;
    DROP POLICY IF EXISTS "Authenticated users can manage item data" ON content_item_data;
    
    -- Drop policies for content_section_linked_items
    DROP POLICY IF EXISTS "Users can view linked items" ON content_section_linked_items;
    DROP POLICY IF EXISTS "Authenticated users can manage linked items" ON content_section_linked_items;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Create content_item_templates table if not exists
CREATE TABLE IF NOT EXISTS content_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update content_fields constraint to include linked_items
DO $$ 
BEGIN
    -- First drop the existing constraint if it exists
    ALTER TABLE content_fields DROP CONSTRAINT IF EXISTS content_fields_field_type_check;
    
    -- Add new constraint
    ALTER TABLE content_fields ADD CONSTRAINT content_fields_field_type_check 
    CHECK (field_type = ANY (ARRAY[
      'text'::text, 'textarea'::text, 'richtext'::text, 
      'number'::text, 'boolean'::text, 'select'::text, 
      'options'::text, 'items'::text, 'media'::text, 
      'media_list'::text, 'list'::text, 'object'::text,
      'linked_items'::text
    ]));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not update field type constraint: %', SQLERRM;
END $$;

-- Add item_template_id to content_fields if not exists
DO $$ 
BEGIN
    ALTER TABLE content_fields ADD COLUMN IF NOT EXISTS item_template_id UUID REFERENCES content_item_templates(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Column item_template_id might already exist: %', SQLERRM;
END $$;

-- Update constraint to ensure field belongs to either section or item template
DO $$ 
BEGIN
    -- Drop old constraint if exists
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_field_data UNIQUE (item_id, field_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_item_data_item ON content_item_data(item_id);
CREATE INDEX IF NOT EXISTS idx_content_item_data_field ON content_item_data(field_id);

-- Create linked items junction table for sections
CREATE TABLE IF NOT EXISTS content_section_linked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES content_sections(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_section_field_item UNIQUE (section_id, field_id, item_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_linked_items_section ON content_section_linked_items(section_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_field ON content_section_linked_items(field_id);
CREATE INDEX IF NOT EXISTS idx_linked_items_item ON content_section_linked_items(item_id);

-- Enable RLS
ALTER TABLE content_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_item_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_section_linked_items ENABLE ROW LEVEL SECURITY;

-- Create new policies for item templates
CREATE POLICY "Public can view item templates" ON content_item_templates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage item templates" ON content_item_templates
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for items
CREATE POLICY "Public can view active items" ON content_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage items" ON content_items
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for item data
CREATE POLICY "Users can view item data" ON content_item_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM content_items 
            WHERE content_items.id = content_item_data.item_id 
            AND content_items.is_active = true
        )
    );

CREATE POLICY "Authenticated users can manage item data" ON content_item_data
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Policies for linked items
CREATE POLICY "Users can view linked items" ON content_section_linked_items
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage linked items" ON content_section_linked_items
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_item_templates_updated_at') THEN
        CREATE TRIGGER update_content_item_templates_updated_at 
        BEFORE UPDATE ON content_item_templates 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_items_updated_at') THEN
        CREATE TRIGGER update_content_items_updated_at 
        BEFORE UPDATE ON content_items 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_item_data_updated_at') THEN
        CREATE TRIGGER update_content_item_data_updated_at 
        BEFORE UPDATE ON content_item_data 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
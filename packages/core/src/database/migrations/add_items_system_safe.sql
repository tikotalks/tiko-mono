-- Safe Items System Migration
-- This version checks for existing types and tables

-- First, let's check what enum exists for field types
DO $$ 
DECLARE
    enum_exists boolean;
    enum_name text;
BEGIN
    -- Check for field_type enum
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'field_type'
    ) INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Check for content_field_type enum
        SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'content_field_type'
        ) INTO enum_exists;
        
        IF enum_exists THEN
            enum_name := 'content_field_type';
        END IF;
    ELSE
        enum_name := 'field_type';
    END IF;
    
    -- If we found an enum, try to add linked_items
    IF enum_name IS NOT NULL THEN
        BEGIN
            EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS ''linked_items''', enum_name);
        EXCEPTION
            WHEN duplicate_object THEN null;
            WHEN others THEN
                RAISE NOTICE 'Could not add linked_items to enum %: %', enum_name, SQLERRM;
        END;
    END IF;
END $$;

-- Add is_translatable to content_fields if it doesn't exist
ALTER TABLE content_fields 
ADD COLUMN IF NOT EXISTS is_translatable BOOLEAN DEFAULT true;

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

-- Update/Add the constraint to allow either section_template_id OR item_template_id
DO $$
BEGIN
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

-- Create updated_at triggers (check if function exists first)
DO $$
BEGIN
    -- Check if update_updated_at_column function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        -- Create triggers
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
    ELSE
        RAISE NOTICE 'update_updated_at_column function not found, skipping triggers';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Some triggers already exist, continuing...';
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Items system migration completed successfully!';
END $$;
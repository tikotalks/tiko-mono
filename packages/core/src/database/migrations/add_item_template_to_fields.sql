-- Add item_template_id to fields table
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS item_template_id UUID REFERENCES item_templates(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fields_item_template ON fields(item_template_id);

-- Update the constraint to allow either section_template_id OR item_template_id
ALTER TABLE fields DROP CONSTRAINT IF EXISTS check_template_reference;
ALTER TABLE fields ADD CONSTRAINT check_template_reference CHECK (
  (section_template_id IS NOT NULL AND item_template_id IS NULL) OR 
  (section_template_id IS NULL AND item_template_id IS NOT NULL)
);
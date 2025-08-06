-- Create the content_item_data table to store field values for items
-- This table is expected by content.service.ts line 1120

CREATE TABLE IF NOT EXISTS content_item_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES content_fields(id) ON DELETE CASCADE,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure unique field values per item
    UNIQUE(item_id, field_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_item_data_item_id ON content_item_data(item_id);
CREATE INDEX IF NOT EXISTS idx_content_item_data_field_id ON content_item_data(field_id);

-- Add RLS policies
ALTER TABLE content_item_data ENABLE ROW LEVEL SECURITY;

-- Policy for reading item data (public can read)
CREATE POLICY "Public can read item data" ON content_item_data
    FOR SELECT USING (true);

-- Policy for inserting item data (authenticated users only)
CREATE POLICY "Authenticated users can insert item data" ON content_item_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for updating item data (authenticated users only)
CREATE POLICY "Authenticated users can update item data" ON content_item_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for deleting item data (authenticated users only)
CREATE POLICY "Authenticated users can delete item data" ON content_item_data
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at
CREATE TRIGGER update_content_item_data_updated_at
    BEFORE UPDATE ON content_item_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
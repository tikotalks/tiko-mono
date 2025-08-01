-- Run this SQL in your Supabase dashboard SQL editor
-- This creates the content_section_data table for storing section instance field values

-- Create table for storing section instance data (field values)
CREATE TABLE IF NOT EXISTS content_section_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    language_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_section_data_section
        FOREIGN KEY (section_id) 
        REFERENCES content_sections(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique field values per section/language
    CONSTRAINT unique_section_field_language 
        UNIQUE (section_id, field_key, language_code)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_section_data_section_id ON content_section_data(section_id);
CREATE INDEX IF NOT EXISTS idx_section_data_language ON content_section_data(language_code);

-- Enable Row Level Security
ALTER TABLE content_section_data ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read section data
CREATE POLICY "Section data are viewable by everyone"
    ON content_section_data FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can manage section data"
    ON content_section_data FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_section_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_section_data_updated_at ON content_section_data;
CREATE TRIGGER update_section_data_updated_at
    BEFORE UPDATE ON content_section_data
    FOR EACH ROW
    EXECUTE FUNCTION update_section_data_updated_at();

-- Verify the table was created
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_section_data'
) as content_section_data_table_exists;
-- Create translations table
CREATE TABLE IF NOT EXISTS translations (
    key TEXT NOT NULL,
    locale TEXT NOT NULL,
    value TEXT NOT NULL,
    auto_translated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Composite primary key
    PRIMARY KEY (key, locale)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale);
CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_auto_translated ON translations(auto_translated);

-- Enable Row Level Security
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all translations
CREATE POLICY "Translations are viewable by authenticated users" ON translations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admin/editor users to insert/update/delete translations
CREATE POLICY "Translations are editable by admin/editor users" ON translations
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM user_profiles 
            WHERE role IN ('admin', 'editor')
        )
    );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get effective translation with locale fallback
CREATE OR REPLACE FUNCTION get_effective_translation(p_key TEXT, p_locale TEXT)
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
    v_parent_locale TEXT;
BEGIN
    -- Try exact locale match
    SELECT value INTO v_value 
    FROM translations 
    WHERE key = p_key AND locale = p_locale;
    
    IF v_value IS NOT NULL THEN
        RETURN v_value;
    END IF;
    
    -- Try parent locale (e.g., 'en' for 'en-GB')
    IF p_locale LIKE '%-%' THEN
        v_parent_locale := split_part(p_locale, '-', 1);
        SELECT value INTO v_value 
        FROM translations 
        WHERE key = p_key AND locale = v_parent_locale;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END IF;
    
    -- Fall back to English
    SELECT value INTO v_value 
    FROM translations 
    WHERE key = p_key AND locale = 'en';
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;
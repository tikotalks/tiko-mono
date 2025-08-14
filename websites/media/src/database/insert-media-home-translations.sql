-- Insert translation keys for media website home page curated collections
-- Using minimal columns based on actual table structure

-- Insert key
INSERT INTO public.i18n_keys (key, description) VALUES
    ('media.home.curatedCollections', 'Title for curated collections section on home page')
ON CONFLICT (key) DO NOTHING;

-- Note: The actual translations will need to be added through the admin interface
-- or by using the appropriate columns for the i18n_translations table in your database
-- Example translations:
-- English: "Curated Collections"
-- Dutch: "Samengestelde Collecties"
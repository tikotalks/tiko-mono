-- Insert collection-related translation keys
-- Using minimal columns based on actual table structure

-- Insert keys (minimal approach - only required columns)
INSERT INTO public.i18n_keys (key, description) VALUES
    -- Collection selector keys
    ('admin.collections.selectFromCollection', 'Button to select image from collection items'),
    ('admin.collections.selectCoverFromCollection', 'Title for collection item selector dialog'),
    ('admin.collections.noItemsInCollection', 'Message when collection has no items'),
    ('admin.collections.coverImagePreview', 'Alt text for cover image preview'),
    
    -- Library multi-select keys
    ('admin.library.itemsSelected', 'Label showing number of selected items'),
    ('admin.library.multipleItems', 'Label for multiple selected items'),
    ('admin.library.someAlreadyInCollection', 'Warning when some items are already in collection'),
    
    -- Common action keys
    ('common.saveChanges', 'Save changes button label'),
    ('common.noChanges', 'No changes button label when nothing changed'),
    ('common.saving', 'Saving in progress label'),
    ('common.remove', 'Remove button label'),
    
    -- Collection dialog keys
    ('admin.collections.alreadyInCollection', 'Tooltip for items already in collection'),
    
    -- Library action keys
    ('admin.library.alreadyInCollection', 'Warning when item is already in collection'),
    ('admin.library.addToCollectionFailed', 'Error message when adding to collection fails'),
    ('admin.personalLibrary.alreadyInCollection', 'Warning when item is already in personal library'),
    ('admin.personalLibrary.addToCollectionFailed', 'Error message when adding to personal library fails')
ON CONFLICT (key) DO NOTHING;

-- Note: The actual translations will need to be added through the admin interface
-- or by using the appropriate columns for the i18n_translations table in your database
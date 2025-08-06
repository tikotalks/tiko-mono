-- Check if there's any data for the Yes No items
SELECT 
    cid.id,
    cid.item_id,
    i.name as item_name,
    f.field_key,
    cid.value
FROM 
    content_item_data cid
    JOIN content_items i ON cid.item_id = i.id
    JOIN content_fields f ON cid.field_id = f.id
WHERE 
    i.id IN (
        '9bcb1691-9371-4784-a813-de9369d67ee9',  -- Base item
        'd0ce12b5-c4b6-4122-805c-242ab6f259df'   -- English translation
    )
ORDER BY 
    i.name, f.field_key;

-- If no results, check if there's ANY data in the table
SELECT COUNT(*) as total_records FROM content_item_data;

-- Check if the Yes No items exist
SELECT id, name, slug, base_item_id 
FROM content_items 
WHERE id IN (
    '9bcb1691-9371-4784-a813-de9369d67ee9',
    'd0ce12b5-c4b6-4122-805c-242ab6f259df'
);
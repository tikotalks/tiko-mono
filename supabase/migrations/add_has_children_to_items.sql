-- Add has_children column to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false;

-- Create an index on has_children for better query performance
CREATE INDEX IF NOT EXISTS idx_items_has_children ON items(has_children) WHERE has_children = true;

-- Update existing items to set has_children = true where they actually have children
UPDATE items AS parent
SET has_children = true
WHERE EXISTS (
    SELECT 1 
    FROM items AS child 
    WHERE child.parent_id = parent.id
);

-- Create a function to automatically update parent's has_children when inserting a child
CREATE OR REPLACE FUNCTION update_parent_has_children_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        UPDATE items 
        SET has_children = true 
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check and update parent's has_children when deleting a child
CREATE OR REPLACE FUNCTION update_parent_has_children_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.parent_id IS NOT NULL THEN
        -- Check if parent still has other children
        IF NOT EXISTS (
            SELECT 1 
            FROM items 
            WHERE parent_id = OLD.parent_id 
            AND id != OLD.id
        ) THEN
            -- No other children, set has_children to false
            UPDATE items 
            SET has_children = false 
            WHERE id = OLD.parent_id;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle parent_id updates
CREATE OR REPLACE FUNCTION update_parent_has_children_on_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If parent_id changed
    IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
        -- Update old parent if exists
        IF OLD.parent_id IS NOT NULL THEN
            -- Check if old parent still has children
            IF NOT EXISTS (
                SELECT 1 
                FROM items 
                WHERE parent_id = OLD.parent_id 
                AND id != NEW.id
            ) THEN
                UPDATE items 
                SET has_children = false 
                WHERE id = OLD.parent_id;
            END IF;
        END IF;
        
        -- Update new parent if exists
        IF NEW.parent_id IS NOT NULL THEN
            UPDATE items 
            SET has_children = true 
            WHERE id = NEW.parent_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_parent_has_children_on_insert_trigger ON items;
CREATE TRIGGER update_parent_has_children_on_insert_trigger
    AFTER INSERT ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_has_children_on_insert();

DROP TRIGGER IF EXISTS update_parent_has_children_on_delete_trigger ON items;
CREATE TRIGGER update_parent_has_children_on_delete_trigger
    AFTER DELETE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_has_children_on_delete();

DROP TRIGGER IF EXISTS update_parent_has_children_on_update_trigger ON items;
CREATE TRIGGER update_parent_has_children_on_update_trigger
    AFTER UPDATE OF parent_id ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_has_children_on_update();

-- Add comment to document the column
COMMENT ON COLUMN items.has_children IS 'Performance optimization: indicates if this item has child items';
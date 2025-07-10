-- Add order_index to existing todo_groups table
ALTER TABLE todo_groups 
ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- Update existing groups with sequential order_index
WITH ordered_groups AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as new_order
  FROM todo_groups
)
UPDATE todo_groups
SET order_index = ordered_groups.new_order
FROM ordered_groups
WHERE todo_groups.id = ordered_groups.id;
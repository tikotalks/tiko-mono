-- Add public item support to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT FALSE;

-- Create index for public item queries
CREATE INDEX IF NOT EXISTS idx_items_public ON items(is_public, app_name) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_items_curated ON items(is_curated, app_name) WHERE is_curated = true;

-- Create user_item_order table for custom ordering
CREATE TABLE IF NOT EXISTS user_item_order (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  custom_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_item_order_lookup 
ON user_item_order(user_id, item_id);

-- Create RLS policies for user_item_order
ALTER TABLE user_item_order ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own custom ordering
CREATE POLICY "Users can manage their own item ordering" ON user_item_order
  FOR ALL USING (auth.uid() = user_id);

-- Add constraint: curated items must be public
-- Create a function to enforce the constraint
CREATE OR REPLACE FUNCTION ensure_curated_is_public()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting is_curated to true, ensure is_public is also true
  IF NEW.is_curated = true THEN
    NEW.is_public := true;
  END IF;
  
  -- If setting is_public to false, ensure is_curated is also false
  IF NEW.is_public = false THEN
    NEW.is_curated := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce the constraint
CREATE TRIGGER enforce_curated_public_constraint
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION ensure_curated_is_public();

-- Update RLS policies for items table
-- Users can only see their own items OR public items
CREATE POLICY "Users can view own or public items" ON items
  FOR SELECT USING (
    user_id = auth.uid() 
    OR is_public = true 
    OR is_curated = true
  );

-- Admins can only update curated status on public items
CREATE POLICY "Admins can update curated status" ON items
  FOR UPDATE USING (
    is_public = true
  )
  WITH CHECK (
    is_public = true
  );

-- Function to get items with custom ordering
CREATE OR REPLACE FUNCTION get_items_with_custom_order(p_user_id UUID, p_app_name TEXT DEFAULT 'sequence')
RETURNS TABLE (
  id UUID,
  user_id UUID,
  app_name TEXT,
  type TEXT,
  name TEXT,
  content TEXT,
  metadata JSONB,
  parent_id UUID,
  order_index INTEGER,
  custom_index INTEGER,
  icon TEXT,
  color TEXT,
  is_public BOOLEAN,
  is_curated BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.app_name,
    i.type,
    i.name,
    i.content,
    i.metadata,
    i.parent_id,
    i.order_index,
    uso.custom_index,
    i.icon,
    i.color,
    i.is_public,
    i.is_curated,
    i.created_at,
    i.updated_at
  FROM items i
  LEFT JOIN user_item_order uio 
    ON uio.item_id = i.id 
    AND uio.user_id = p_user_id
  WHERE i.app_name = p_app_name
    AND (i.user_id = p_user_id OR i.is_public = true OR i.is_curated = true)
  ORDER BY 
    COALESCE(uio.custom_index, i.order_index);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_items_with_custom_order(UUID, TEXT) TO authenticated;
-- Create items table for unified item storage across all apps
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  parent_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_items_app_name ON public.items(app_name);
CREATE INDEX idx_items_type ON public.items(type);
CREATE INDEX idx_items_parent_id ON public.items(parent_id);
CREATE INDEX idx_items_is_public ON public.items(is_public);
CREATE INDEX idx_items_user_app ON public.items(user_id, app_name);
CREATE INDEX idx_items_parent_order ON public.items(parent_id, order_index);

-- Add full text search
CREATE INDEX idx_items_search ON public.items USING gin(to_tsvector('english', name || ' ' || COALESCE(content, '')));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own items or public items
CREATE POLICY "Users can view own items" ON public.items
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

-- Users can only insert their own items
CREATE POLICY "Users can insert own items" ON public.items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
CREATE POLICY "Users can update own items" ON public.items
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "Users can delete own items" ON public.items
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.items IS 'Unified storage for all app items (todos, radio stations, cards, etc)';

-- Add comments to columns
COMMENT ON COLUMN public.items.app_name IS 'The app this item belongs to (todo, radio, cards, etc)';
COMMENT ON COLUMN public.items.type IS 'The type of item within the app (todo_group, todo_item, radio_station, card_deck, card, etc)';
COMMENT ON COLUMN public.items.metadata IS 'App-specific data stored as JSON';
COMMENT ON COLUMN public.items.parent_id IS 'For hierarchical items (e.g., todo items belong to groups)';
COMMENT ON COLUMN public.items.order_index IS 'For ordering items within their parent or app';
COMMENT ON COLUMN public.items.tags IS 'Array of tags for categorization';
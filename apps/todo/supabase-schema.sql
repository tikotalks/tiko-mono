-- Create todo_groups table
CREATE TABLE IF NOT EXISTS todo_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  item_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create todo_items table
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES todo_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_todo_groups_user_id ON todo_groups(user_id);
CREATE INDEX idx_todo_items_group_id ON todo_items(group_id);
CREATE INDEX idx_todo_items_user_id ON todo_items(user_id);

-- Enable Row Level Security
ALTER TABLE todo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Create policies for todo_groups
CREATE POLICY "Users can view their own todo groups" ON todo_groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todo groups" ON todo_groups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo groups" ON todo_groups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo groups" ON todo_groups
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for todo_items
CREATE POLICY "Users can view their own todo items" ON todo_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todo items" ON todo_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo items" ON todo_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo items" ON todo_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_todo_groups_updated_at BEFORE UPDATE ON todo_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
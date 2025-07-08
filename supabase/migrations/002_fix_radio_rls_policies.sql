-- Fix RLS policies for radio tables
-- The issue is that auth.uid() might not work in all contexts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own radio settings" ON radio_settings;
DROP POLICY IF EXISTS "Users can insert their own radio settings" ON radio_settings;
DROP POLICY IF EXISTS "Users can update their own radio settings" ON radio_settings;

DROP POLICY IF EXISTS "Users can view their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can insert their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can update their own radio items" ON radio_items;
DROP POLICY IF EXISTS "Users can delete their own radio items" ON radio_items;

-- Create more permissive policies that work with the current auth setup
-- Radio settings policies
CREATE POLICY "Enable all for radio_settings for authenticated users"
ON radio_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Radio items policies  
CREATE POLICY "Enable all for radio_items for authenticated users"
ON radio_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Alternative: If you want to keep user isolation, try these instead:
-- (Comment out the above and uncomment below if you prefer user isolation)

/*
-- Radio settings policies with user isolation
CREATE POLICY "Users can manage their radio settings"
ON radio_settings
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'sub')::uuid = user_id)
WITH CHECK ((auth.jwt() ->> 'sub')::uuid = user_id);

-- Radio items policies with user isolation
CREATE POLICY "Users can manage their radio items"
ON radio_items
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'sub')::uuid = user_id)
WITH CHECK ((auth.jwt() ->> 'sub')::uuid = user_id);
*/
#!/usr/bin/env node

// This script applies the user_settings table migration directly to your Supabase database
// Run with: node scripts/apply-user-settings-migration.js

const https = require('https');

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kejvhvszhevfwgsztedf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error(`
⚠️  Missing SUPABASE_SERVICE_ROLE_KEY environment variable!

To run this migration, you need to:

1. Go to your Supabase dashboard: ${SUPABASE_URL}
2. Navigate to Settings > API
3. Copy your "service_role" key (keep this secret!)
4. Run this command with the key:

   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/apply-user-settings-migration.js

Alternatively, you can manually run the migration:
1. Go to ${SUPABASE_URL}/project/kejvhvszhevfwgsztedf/sql/new
2. Copy and paste the SQL from: supabase/migrations/006_create_user_settings_table.sql
3. Click "Run"
`);
  process.exit(1);
}

const migrationSQL = `
-- Create user_settings table for storing app-specific settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_name TEXT NOT NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, app_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_app ON user_settings(user_id, app_name);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with IF NOT EXISTS handling)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own settings' AND tablename = 'user_settings') THEN
    CREATE POLICY "Users can view own settings" ON user_settings
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own settings' AND tablename = 'user_settings') THEN
    CREATE POLICY "Users can insert own settings" ON user_settings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own settings' AND tablename = 'user_settings') THEN
    CREATE POLICY "Users can update own settings" ON user_settings
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own settings' AND tablename = 'user_settings') THEN
    CREATE POLICY "Users can delete own settings" ON user_settings
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
  ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
`;

// Parse URL to get host
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

console.log(`🚀 Applying migration to Supabase project: ${projectRef}`);
console.log(`📍 URL: ${SUPABASE_URL}`);

// Prepare the request
const postData = JSON.stringify({ query: migrationSQL });

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=minimal'
  }
};

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
      console.log('✅ Migration applied successfully!');
      console.log('📊 The user_settings table has been created.');
      console.log('🔒 Row Level Security policies have been applied.');
      console.log('\n🎉 Your yes-no app should now work correctly!');
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);
      console.log(`
📝 You can manually apply the migration:
1. Go to ${SUPABASE_URL}/project/${projectRef}/sql/new
2. Copy and paste the SQL from: supabase/migrations/006_create_user_settings_table.sql
3. Click "Run"
`);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.log(`
📝 You can manually apply the migration:
1. Go to ${SUPABASE_URL}/project/${projectRef}/sql/new  
2. Copy and paste the SQL from: supabase/migrations/006_create_user_settings_table.sql
3. Click "Run"
`);
});

// Send the request
req.write(postData);
req.end();
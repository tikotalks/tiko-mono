#!/usr/bin/env node

// This script applies the show_in_navigation column update migration to your Supabase database
// Run with: node scripts/apply-show-in-navigation-migration.js

const https = require('https');
const fs = require('fs');
const path = require('path');

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

   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/apply-show-in-navigation-migration.js

Alternatively, you can manually run the migration:
1. Go to ${SUPABASE_URL}/project/kejvhvszhevfwgsztedf/sql/new
2. Copy and paste the SQL from: supabase/migrations/20250205_update_show_in_navigation_column.sql
3. Click "Run"
`);
  process.exit(1);
}

// Read the migration SQL from file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250205_update_show_in_navigation_column.sql');
let migrationSQL;

try {
  migrationSQL = fs.readFileSync(migrationPath, 'utf8');
} catch (error) {
  console.error(`❌ Failed to read migration file: ${error.message}`);
  process.exit(1);
}

// Parse URL to get host
const url = new URL(SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

console.log(`🚀 Applying show_in_navigation migration to Supabase project: ${projectRef}`);
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`📄 Migration: Converting show_in_navigation from BOOLEAN to TEXT with values: 'false', 'mobile', 'desktop', 'true'`);

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
      console.log('📊 The show_in_navigation column has been updated to TEXT type.');
      console.log('✓ CHECK constraint added for allowed values: "false", "mobile", "desktop", "true"');
      console.log('✓ Existing boolean values have been converted to text');
      console.log('✓ Default value set to "true"');
      console.log('\n🎉 Your content_pages table is now updated!');
      
      console.log('\n📝 Value meanings:');
      console.log('  - "false"   → Hidden from all navigation');
      console.log('  - "mobile"  → Shows only in mobile navigation');
      console.log('  - "desktop" → Shows only in desktop navigation');
      console.log('  - "true"    → Shows in all navigation (default)');
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);
      console.log(`
📝 You can manually apply the migration:
1. Go to ${SUPABASE_URL}/project/${projectRef}/sql/new
2. Copy and paste the SQL from: supabase/migrations/20250205_update_show_in_navigation_column.sql
3. Click "Run"

🔄 If you need to rollback, use:
   supabase/migrations/20250205_update_show_in_navigation_column_rollback.sql
`);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.log(`
📝 You can manually apply the migration:
1. Go to ${SUPABASE_URL}/project/${projectRef}/sql/new  
2. Copy and paste the SQL from: supabase/migrations/20250205_update_show_in_navigation_column.sql
3. Click "Run"

🔄 If you need to rollback, use:
   supabase/migrations/20250205_update_show_in_navigation_column_rollback.sql
`);
});

// Send the request
req.write(postData);
req.end();
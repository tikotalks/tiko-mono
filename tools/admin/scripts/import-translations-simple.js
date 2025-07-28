#!/usr/bin/env node

/**
 * Simple import script for translations
 * Run with: SUPABASE_SERVICE_KEY=your-key node import-translations-simple.js
 */

const fs = require('fs');
const path = require('path');

// Check for service key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.log('Usage: SUPABASE_SERVICE_KEY=your-service-key node import-translations-simple.js');
  process.exit(1);
}

const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co';

// Function to flatten nested object
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = String(obj[key] || '');
      }
    }
  }
  
  return flattened;
}

// Function to make Supabase request
async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${error}`);
  }

  return response.json();
}

// Function to call RPC
async function callRpc(functionName, params = {}) {
  return supabaseRequest('/rpc/' + functionName, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Function to parse TypeScript file
function parseTypeScriptExport(content) {
  try {
    // Extract the default export
    const match = content.match(/export default\s*({[\s\S]*?})\s*(?:as\s+[\w]+)?$/);
    if (!match) {
      throw new Error('Could not find default export');
    }
    
    // Clean the export string
    let exportStr = match[1];
    
    // Remove TypeScript types and comments
    exportStr = exportStr
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* comments */
      .replace(/\/\/.*$/gm, '') // Remove // comments
      .replace(/as\s+[\w.]+/g, '') // Remove type assertions
      .replace(/\s*:\s*[\w\s|<>[\]{},.]+(?=[,}])/g, ''); // Remove type annotations
    
    // Convert to valid JSON-like object
    // Replace unquoted keys with quoted keys
    exportStr = exportStr.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    
    // Use Function constructor to safely evaluate
    const fn = new Function('return ' + exportStr);
    return fn();
  } catch (error) {
    console.error('Error parsing TypeScript:', error.message);
    throw error;
  }
}

async function importTranslations() {
  console.log('🚀 Starting translation import...');
  
  const localesDir = path.join(__dirname, '../../../packages/ui/src/i18n/locales/base');
  console.log(`📁 Reading from: ${localesDir}`);
  
  try {
    // First get or create admin user for import
    console.log('👤 Finding admin user...');
    const adminUsers = await supabaseRequest('/user_profiles?role=eq.admin&limit=1');
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    const adminUserId = adminUsers[0].user_id;
    console.log('✅ Admin user found');
    
    // Get list of locale files
    const localeFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));
    console.log(`🌍 Found ${localeFiles.length} locale files`);
    
    let totalImported = 0;
    
    for (const file of localeFiles) {
      const locale = file.replace('.ts', '');
      console.log(`\n📖 Importing ${locale}...`);
      
      try {
        const content = fs.readFileSync(path.join(localesDir, file), 'utf-8');
        const translations = parseTypeScriptExport(content);
        const flatTranslations = flattenObject(translations);
        
        let imported = 0;
        
        // Import each translation
        for (const [key, value] of Object.entries(flatTranslations)) {
          try {
            // Create translation using RPC function
            await callRpc('create_translation_version', {
              p_key: key,
              p_locale: locale,
              p_value: value,
              p_auto_translated: false
            });
            imported++;
            
            // Show progress every 10 translations
            if (imported % 10 === 0) {
              process.stdout.write(`\r   ✅ Imported ${imported} translations...`);
            }
          } catch (error) {
            // Ignore duplicate errors
            if (!error.message.includes('duplicate')) {
              console.error(`\n   ❌ Error importing ${key}:`, error.message);
            }
          }
        }
        
        console.log(`\n   ✅ Imported ${imported} translations for ${locale}`);
        totalImported += imported;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${locale}:`, error.message);
      }
    }
    
    console.log('\n=================================');
    console.log(`✅ Import complete!`);
    console.log(`📊 Total translations imported: ${totalImported}`);
    console.log('=================================');
    
    // Get statistics
    console.log('\n📊 Fetching statistics...');
    const localeDetails = await supabaseRequest('/locale_details');
    
    if (localeDetails && localeDetails.length > 0) {
      console.log('\n📊 Translation Statistics:');
      localeDetails.forEach(stat => {
        console.log(`   ${stat.flag_emoji} ${stat.code}: ${stat.translation_count} translations (${stat.completion_percentage}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importTranslations().catch(console.error);
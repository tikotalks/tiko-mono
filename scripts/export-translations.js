#!/usr/bin/env node

/**
 * Export translations from database to JSON files
 * This script fetches approved translations from Supabase and writes them to the generated directory
 * 
 * Usage: 
 *   SUPABASE_SERVICE_KEY=your-key node scripts/export-translations.js
 *   
 * Can be integrated into build process or run locally during development
 */

const fs = require('fs');
const path = require('path');

// Check for service key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_KEY environment variable');
  console.log('Usage: SUPABASE_SERVICE_KEY=your-service-key node scripts/export-translations.js');
  process.exit(1);
}

const SUPABASE_URL = 'https://kejvhvszhevfwgsztedf.supabase.co';
const OUTPUT_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/generated');

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

// Function to unflatten dot notation to nested object
function unflattenObject(flat) {
  const result = {};
  
  for (const key in flat) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = flat[key];
  }
  
  return result;
}

// Function to sort object keys recursively
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sorted = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
}

async function exportTranslations() {
  console.log('🚀 Starting translation export...');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log('✅ Created output directory');
    }
    
    // Get all enabled locales
    console.log('🌍 Fetching enabled locales...');
    const locales = await supabaseRequest('/i18n_locales?enabled=eq.true&order=code');
    console.log(`✅ Found ${locales.length} enabled locales`);
    
    // Export translations for each locale
    for (const locale of locales) {
      console.log(`\n📝 Exporting ${locale.flag_emoji} ${locale.code}...`);
      
      try {
        // Fetch approved translations for this locale
        const translations = await supabaseRequest(
          `/i18n_translations?locale=eq.${locale.code}&order=key`
        );
        
        if (translations.length === 0) {
          console.log(`   ⚠️  No translations found for ${locale.code}`);
          continue;
        }
        
        // Convert to key-value object
        const flatTranslations = {};
        for (const translation of translations) {
          flatTranslations[translation.key] = translation.value;
        }
        
        // Apply locale inheritance if needed
        if (locale.fallback_locale) {
          console.log(`   🔄 Applying fallback from ${locale.fallback_locale}...`);
          const fallbackTranslations = await supabaseRequest(
            `/i18n_translations?locale=eq.${locale.fallback_locale}&order=key`
          );
          
          // Add fallback translations that don't exist in current locale
          for (const translation of fallbackTranslations) {
            if (!flatTranslations[translation.key]) {
              flatTranslations[translation.key] = translation.value;
            }
          }
        }
        
        // Final fallback to English if not English
        if (locale.code !== 'en' && !locale.code.startsWith('en-')) {
          console.log(`   🔄 Applying final fallback from en...`);
          const englishTranslations = await supabaseRequest(
            `/i18n_translations?locale=eq.en&order=key`
          );
          
          for (const translation of englishTranslations) {
            if (!flatTranslations[translation.key]) {
              flatTranslations[translation.key] = translation.value;
            }
          }
        }
        
        // Unflatten to nested structure
        const nestedTranslations = unflattenObject(flatTranslations);
        
        // Sort keys for consistent output
        const sortedTranslations = sortObjectKeys(nestedTranslations);
        
        // Write to file
        const outputPath = path.join(OUTPUT_DIR, `${locale.code}.json`);
        fs.writeFileSync(
          outputPath,
          JSON.stringify(sortedTranslations, null, 2) + '\n'
        );
        
        console.log(`   ✅ Exported ${Object.keys(flatTranslations).length} translations to ${locale.code}.json`);
        
      } catch (error) {
        console.error(`   ❌ Error exporting ${locale.code}:`, error.message);
      }
    }
    
    // Create index file that exports all locales
    console.log('\n📝 Creating index file...');
    const indexContent = `// Auto-generated translation exports
// Generated on ${new Date().toISOString()}

${locales.map(l => `import ${l.code.replace('-', '_')} from './${l.code}.json';`).join('\n')}

export const generatedTranslations = {
${locales.map(l => `  '${l.code}': ${l.code.replace('-', '_')},`).join('\n')}
};

export default generatedTranslations;
`;
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
    
    console.log('\n=================================');
    console.log('✅ Export complete!');
    console.log(`📊 Exported translations for ${locales.length} locales`);
    console.log('=================================');
    
    // Show statistics
    const stats = await supabaseRequest('/i18n_locale_details');
    if (stats && stats.length > 0) {
      console.log('\n📊 Translation Statistics:');
      stats.forEach(stat => {
        console.log(`   ${stat.flag_emoji} ${stat.code}: ${stat.translation_count} translations (${stat.completion_percentage}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run the export
exportTranslations().catch(console.error);
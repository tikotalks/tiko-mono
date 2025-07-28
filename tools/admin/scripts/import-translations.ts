/**
 * Script to import existing translations from i18n files into the database
 * Run this once to populate the translations table
 */

import { translationService } from '@tiko/core';
import * as fs from 'fs';
import * as path from 'path';

// Import all locale files
const localesDir = path.join(__dirname, '../../../packages/ui/src/i18n/locales');

async function flattenObject(obj: any, prefix = ''): Promise<Record<string, string>> {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively flatten nested objects
        const nested = await flattenObject(obj[key], newKey);
        Object.assign(flattened, nested);
      } else {
        // Add the flat key-value pair
        flattened[newKey] = String(obj[key]);
      }
    }
  }
  
  return flattened;
}

async function importTranslations() {
  console.log('Starting translation import...');
  
  try {
    // Get all locale files
    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));
    
    for (const file of files) {
      const locale = file.replace('.ts', '');
      console.log(`\nImporting ${locale}...`);
      
      // Dynamic import of the locale file
      const modulePath = path.join(localesDir, file);
      const module = await import(modulePath);
      
      // Get the default export (the translations object)
      const translations = module.default;
      
      // Flatten the nested object structure
      const flattened = await flattenObject(translations);
      
      // Import to database
      await translationService.importTranslations(locale, flattened);
      
      console.log(`✓ Imported ${Object.keys(flattened).length} keys for ${locale}`);
    }
    
    // Get statistics
    const stats = await translationService.getStatistics();
    console.log('\n=== Import Complete ===');
    console.log(`Total keys: ${stats.totalKeys}`);
    console.log(`Locales: ${stats.locales.join(', ')}`);
    
    for (const locale of stats.locales) {
      const completion = stats.completeness[locale];
      console.log(`${locale}: ${completion.translated}/${stats.totalKeys} (${completion.percentage}%)`);
    }
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importTranslations();
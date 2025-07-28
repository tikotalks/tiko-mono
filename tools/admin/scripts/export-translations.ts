/**
 * Script to export translations from database to JSON files
 * This can be run during build process or as a separate step
 */

import { translationService } from '@tiko/core';
import * as fs from 'fs';
import * as path from 'path';

// Export to the UI package's generated locale directory
const outputDir = path.join(__dirname, '../../../packages/ui/src/i18n/locales/generated');

async function exportAllTranslations() {
  console.log('Exporting translations from database...');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all available locales
    const stats = await translationService.getStatistics();
    const locales = stats.locales;
    
    console.log(`Found ${locales.length} locales to export`);
    
    for (const locale of locales) {
      console.log(`\nExporting ${locale}...`);
      
      // Generate complete JSON with fallbacks
      const translations = await translationService.generateJson(locale);
      
      // Write to file
      const outputPath = path.join(outputDir, `${locale}.json`);
      fs.writeFileSync(
        outputPath,
        JSON.stringify(translations, null, 2),
        'utf-8'
      );
      
      const keyCount = Object.keys(translations).length;
      console.log(`✓ Exported ${keyCount} keys to ${outputPath}`);
    }
    
    console.log('\n=== Export Complete ===');
    console.log(`All translations exported to: ${outputDir}`);
    
    // Generate an index file for easy imports
    const indexContent = `// Auto-generated translation exports
${locales.map(locale => `export { default as ${locale.replace('-', '_')} } from './${locale}.json';`).join('\n')}

export const availableLocales = ${JSON.stringify(locales, null, 2)};
`;
    
    fs.writeFileSync(
      path.join(outputDir, 'index.ts'),
      indexContent,
      'utf-8'
    );
    
    console.log('✓ Generated index.ts for imports');
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

// Run the export
exportAllTranslations();
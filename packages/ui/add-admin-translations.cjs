#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Admin section to add
const adminSection = `  admin: {
    login: {
      title: 'TODO: Translate to LANG',
      subtitle: 'TODO: Translate to LANG',
      emailPlaceholder: 'TODO: Translate to LANG',
      passwordPlaceholder: 'TODO: Translate to LANG',
      accessInfo: 'TODO: Translate to LANG',
      noPermission: 'TODO: Translate to LANG'
    },
    dashboard: {
      title: 'TODO: Translate to LANG',
      totalImages: 'TODO: Translate to LANG',
      storageUsed: 'TODO: Translate to LANG',
      lastUpload: 'TODO: Translate to LANG',
      uploadImages: 'TODO: Translate to LANG',
      uploadDescription: 'TODO: Translate to LANG',
      viewLibrary: 'TODO: Translate to LANG',
      libraryDescription: 'TODO: Translate to LANG'
    },
    upload: {
      title: 'TODO: Translate to LANG',
      dropZone: 'TODO: Translate to LANG',
      selectFiles: 'TODO: Translate to LANG',
      uploading: 'TODO: Translate to LANG',
      processing: 'TODO: Translate to LANG',
      complete: 'TODO: Translate to LANG',
      dragDrop: 'TODO: Translate to LANG',
      or: 'TODO: Translate to LANG',
      uploadQueue: 'TODO: Translate to LANG',
      startUpload: 'TODO: Translate to LANG',
      clearQueue: 'TODO: Translate to LANG',
      onlyImages: 'TODO: Translate to LANG',
      uploadSuccess: 'TODO: Translate to LANG',
      uploadError: 'TODO: Translate to LANG'
    },
    library: {
      title: 'TODO: Translate to LANG',
      search: 'TODO: Translate to LANG',
      filter: 'TODO: Translate to LANG',
      category: 'TODO: Translate to LANG',
      tags: 'TODO: Translate to LANG',
      noImages: 'TODO: Translate to LANG'
    }
  }`;

// Language mapping
const languageNames = {
  'bg': 'Bulgarian',
  'cs': 'Czech',
  'cy': 'Welsh',
  'da': 'Danish',
  'de': 'German',
  'el': 'Greek',
  'es': 'Spanish',
  'et': 'Estonian',
  'fi': 'Finnish',
  'fr': 'French',
  'ga': 'Irish',
  'hr': 'Croatian',
  'hu': 'Hungarian',
  'hy': 'Armenian',
  'is': 'Icelandic',
  'it': 'Italian',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'mt': 'Maltese',
  'nl': 'Dutch',
  'no': 'Norwegian',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ro': 'Romanian',
  'ru': 'Russian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sv': 'Swedish',
  'bg-BG': 'Bulgarian (Bulgaria)',
  'cs-CZ': 'Czech (Czech Republic)',
  'cy-GB': 'Welsh (Great Britain)',
  'da-DK': 'Danish (Denmark)',
  'de-AT': 'German (Austria)',
  'de-CH': 'German (Switzerland)',
  'de-DE': 'German (Germany)',
  'el-GR': 'Greek (Greece)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-GB': 'English (Great Britain)',
  'en-US': 'English (United States)',
  'es-AR': 'Spanish (Argentina)',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'et-EE': 'Estonian (Estonia)',
  'fi-FI': 'Finnish (Finland)',
  'fr-BE': 'French (Belgium)',
  'fr-CA': 'French (Canada)',
  'fr-FR': 'French (France)',
  'ga-IE': 'Irish (Ireland)',
  'hr-HR': 'Croatian (Croatia)',
  'hu-HU': 'Hungarian (Hungary)',
  'hy-AM': 'Armenian (Armenia)',
  'is-IS': 'Icelandic (Iceland)',
  'it-IT': 'Italian (Italy)',
  'lt-LT': 'Lithuanian (Lithuania)',
  'lv-LV': 'Latvian (Latvia)',
  'mt-MT': 'Maltese (Malta)',
  'nl-BE': 'Dutch (Belgium)',
  'nl-NL': 'Dutch (Netherlands)',
  'no-NO': 'Norwegian (Norway)',
  'pl-PL': 'Polish (Poland)',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'ro-RO': 'Romanian (Romania)',
  'ru-RU': 'Russian (Russia)',
  'sk-SK': 'Slovak (Slovakia)',
  'sl-SI': 'Slovenian (Slovenia)',
  'sv-SE': 'Swedish (Sweden)'
};

function processFile(filePath, langCode) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if admin section already exists
  if (content.includes('admin:')) {
    console.log(`✓ ${path.basename(filePath)} already has admin section`);
    return;
  }
  
  const langName = languageNames[langCode] || langCode;
  const adminSectionWithLang = adminSection.replace(/LANG/g, langName);
  
  // Find the last closing brace of the main object
  // Look for the pattern that closes the uiDocs section (or the last section)
  const lastSectionMatch = content.match(/(\s*uiDocs:\s*{[^}]*}[^}]*})\s*,?\s*}\s*\)?\s*$/s);
  
  if (lastSectionMatch) {
    // Insert admin section after uiDocs but before the final closing brace
    const insertPosition = lastSectionMatch.index + lastSectionMatch[1].length;
    const newContent = 
      content.slice(0, insertPosition) + 
      ',\n' + adminSectionWithLang + 
      content.slice(insertPosition);
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Added admin section to ${path.basename(filePath)}`);
  } else {
    console.error(`✗ Could not find insertion point in ${path.basename(filePath)}`);
  }
}

// Process base language files
const baseDir = path.join(__dirname, 'src/i18n/locales/base');
const baseFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.ts') && f !== 'en.ts');

console.log('Processing base language files...');
baseFiles.forEach(file => {
  const langCode = file.replace('.ts', '');
  processFile(path.join(baseDir, file), langCode);
});

// Process locale-specific files
const localesDir = path.join(__dirname, 'src/i18n/locales');
const localeFiles = fs.readdirSync(localesDir).filter(f => 
  f.endsWith('.ts') && 
  !['index.ts', 'en-GB.ts', 'en-US.ts'].includes(f) &&
  !fs.statSync(path.join(localesDir, f)).isDirectory()
);

console.log('\nProcessing locale-specific files...');
localeFiles.forEach(file => {
  const langCode = file.replace('.ts', '');
  processFile(path.join(localesDir, file), langCode);
});

console.log('\nDone!');
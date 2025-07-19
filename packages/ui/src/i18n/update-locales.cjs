#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the en-US file as the source of truth
const enUSPath = path.join(__dirname, 'locales/en-US.ts');
const enUSContent = fs.readFileSync(enUSPath, 'utf8');

// Extract the translation object from en-US
const translationMatch = enUSContent.match(/export const enUS: TranslationSchema = (\{[\s\S]*\})\s*$/);
if (!translationMatch) {
  console.error('Could not parse en-US translations');
  process.exit(1);
}

// Parse the en-US translations
let enUSTranslations;
try {
  // Remove TypeScript-specific syntax and evaluate
  const cleanedTranslations = translationMatch[1]
    .replace(/\s+/g, ' ')
    .replace(/,\s*}/g, '}')
    .replace(/'/g, '"');
  
  // Use Function constructor to safely evaluate
  enUSTranslations = new Function('return ' + cleanedTranslations)();
} catch (e) {
  console.error('Failed to parse translations:', e);
  process.exit(1);
}

// Get all locale files
const localesDir = path.join(__dirname, 'locales');
const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'en-US.ts');

// Function to get all keys from an object recursively
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to set a value in an object using dot notation
function setValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  if (!(keys[keys.length - 1] in current)) {
    current[keys[keys.length - 1]] = value;
  }
}

// Function to format the object as TypeScript code
function formatObject(obj, indent = 2) {
  const spaces = ' '.repeat(indent);
  const entries = Object.entries(obj);
  
  if (entries.length === 0) return '{}';
  
  let result = '{\n';
  entries.forEach(([key, value], index) => {
    result += `${spaces}${key}: `;
    if (typeof value === 'object' && value !== null) {
      result += formatObject(value, indent + 2);
    } else {
      result += `'${value}'`;
    }
    if (index < entries.length - 1) result += ',';
    result += '\n';
  });
  result += ' '.repeat(indent - 2) + '}';
  return result;
}

// Get all keys from en-US
const allKeys = getAllKeys(enUSTranslations);
console.log(`Found ${allKeys.length} translation keys in en-US`);

// Process each locale file
localeFiles.forEach(file => {
  const localePath = path.join(localesDir, file);
  const localeContent = fs.readFileSync(localePath, 'utf8');
  const localeName = file.replace('.ts', '');
  
  console.log(`\nProcessing ${localeName}...`);
  
  // Extract the current translations
  const localeMatch = localeContent.match(/export const \w+: TranslationSchema = (\{[\s\S]*\})\s*$/);
  if (!localeMatch) {
    console.error(`Could not parse ${localeName} translations`);
    return;
  }
  
  // Try to parse existing translations
  let existingTranslations = {};
  try {
    const cleanedTranslations = localeMatch[1]
      .replace(/\s+/g, ' ')
      .replace(/,\s*}/g, '}')
      .replace(/'/g, '"');
    existingTranslations = new Function('return ' + cleanedTranslations)();
  } catch (e) {
    console.warn(`Failed to parse existing translations for ${localeName}, starting fresh`);
  }
  
  // Add missing keys
  let addedCount = 0;
  allKeys.forEach(key => {
    const keys = key.split('.');
    let exists = true;
    let current = existingTranslations;
    
    for (const k of keys) {
      if (!current || !(k in current)) {
        exists = false;
        break;
      }
      current = current[k];
    }
    
    if (!exists) {
      // Get the English value
      let enValue = enUSTranslations;
      for (const k of keys) {
        enValue = enValue[k];
      }
      
      // Add with English placeholder and TODO comment
      const value = `${enValue} [TODO: Translate to ${localeName}]`;
      setValue(existingTranslations, key, value);
      addedCount++;
    }
  });
  
  console.log(`Added ${addedCount} missing keys to ${localeName}`);
  
  // Generate the new file content
  const header = `import type { TranslationSchema } from '../types'

// ${localeName.toUpperCase()} translations
// Keys marked with [TODO: Translate to ${localeName}] need translation
export const ${localeName}: TranslationSchema = `;
  
  const formattedTranslations = formatObject(existingTranslations);
  const newContent = header + formattedTranslations + '\n';
  
  // Write the updated file
  fs.writeFileSync(localePath, newContent);
  console.log(`Updated ${file}`);
});

console.log('\n✅ All locale files updated successfully!');
console.log('\n⚠️  Note: Files other than en-US and en-GB contain placeholders that need proper translation.');
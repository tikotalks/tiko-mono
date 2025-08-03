#!/usr/bin/env node

/**
 * Generate I18n TypeScript files from worker API
 * 
 * This script fetches translation data from the i18n-data worker and generates
 * static TypeScript files for use in the build process.
 * 
 * Usage:
 *   node scripts/generate-i18n-from-worker.js [--app=appName] [--env=production]
 * 
 * Examples:
 *   node scripts/generate-i18n-from-worker.js --app=timer
 *   node scripts/generate-i18n-from-worker.js --env=production
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const WORKER_URLS = {
  development: 'http://localhost:8787', // Local development
  production: 'https://i18n-data.silvandiepen.workers.dev' // Production worker URL (update with your subdomain)
}

const OUTPUT_DIR = path.join(__dirname, '../packages/ui/src/i18n/generated')

// Parse command line arguments
const args = process.argv.slice(2)
const appArg = args.find(arg => arg.startsWith('--app='))?.split('=')[1]
const envArg = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development'

const WORKER_URL = WORKER_URLS[envArg] || WORKER_URLS.development

/**
 * Fetch translation data using the per-language approach
 */
async function fetchTranslationData(app = null) {
  console.log(`🌐 Fetching translation data using per-language approach...`)
  
  try {
    // Step 1: Get all languages
    console.log('📋 Step 1: Fetching languages...')
    const languagesResponse = await fetch(`${WORKER_URL}/languages`, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!languagesResponse.ok) {
      throw new Error(`Failed to fetch languages: ${languagesResponse.status}`)
    }
    
    const languagesResult = await languagesResponse.json()
    if (!languagesResult.success) {
      throw new Error(languagesResult.error || 'Failed to fetch languages')
    }
    
    const languages = languagesResult.data
    console.log(`✅ Found ${languages.length} languages`)
    
    // Step 2: Get all keys
    console.log('🔑 Step 2: Fetching keys...')
    const keysResponse = await fetch(`${WORKER_URL}/keys`, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!keysResponse.ok) {
      throw new Error(`Failed to fetch keys: ${keysResponse.status}`)
    }
    
    const keysResult = await keysResponse.json()
    if (!keysResult.success) {
      throw new Error(keysResult.error || 'Failed to fetch keys')
    }
    
    const keys = keysResult.data
    console.log(`✅ Found ${keys.length} keys`)
    
    // Step 3: Fetch translations for each language
    console.log('🌍 Step 3: Fetching translations per language...')
    const translations = {}
    let totalTranslations = 0
    
    for (const language of languages) {
      process.stdout.write(`  📥 ${language.code}... `)
      
      const langResponse = await fetch(`${WORKER_URL}/translations/${language.code}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!langResponse.ok) {
        console.log(`❌ Failed (${langResponse.status})`)
        translations[language.code] = {}
        continue
      }
      
      const langResult = await langResponse.json()
      if (!langResult.success) {
        console.log(`❌ Error: ${langResult.error}`)
        translations[language.code] = {}
        continue
      }
      
      // Convert array of translations to key-value object
      const langTranslations = {}
      for (const translation of langResult.data) {
        if (translation.key && translation.value) {
          langTranslations[translation.key] = translation.value
        }
      }
      
      translations[language.code] = langTranslations
      totalTranslations += langResult.count
      
      console.log(`✅ ${langResult.count} translations`)
    }
    
    console.log(`🎉 Successfully fetched ${totalTranslations} translations across ${languages.length} languages`)
    
    return {
      keys,
      languages,
      translations
    }
    
  } catch (error) {
    console.error(`❌ Failed to fetch translation data:`, error)
    throw error
  }
}

/**
 * Generate TypeScript interface for translation keys
 */
function generateTypeScript(translationData) {
  const { keys, languages, translations } = translationData
  
  // Create nested key structure for type definitions
  const keyStrings = keys.map(k => k.key || k) // Handle both objects and strings
  const keyStructure = createKeyStructure(keyStrings)
  
  // Generate TypeScript types
  const typeContent = generateTranslationTypes(keyStructure, keys)
  
  // Generate language files
  const languageFiles = {}
  for (const language of languages) {
    languageFiles[language.code] = generateLanguageFile(
      language.code,
      translations[language.code] || {},
      keys
    )
  }
  
  // Generate index file
  const indexContent = generateIndexFile(languages, translationData)
  
  return {
    types: typeContent,
    languages: languageFiles,
    index: indexContent
  }
}

/**
 * Create nested key structure from flat keys
 */
function createKeyStructure(keys) {
  const result = {}
  const conflicts = []
  const skippedKeys = []
  
  // Sort keys to ensure longer (more specific) keys come first
  const sortedKeys = [...keys].sort((a, b) => b.split('.').length - a.split('.').length)
  
  // First pass: identify parent keys that have children
  const keySet = new Set(keys)
  const parentKeysWithChildren = new Set()
  
  for (const key of keys) {
    const parts = key.split('.')
    // Check if any parent path is also a key
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.')
      if (keySet.has(parentPath)) {
        parentKeysWithChildren.add(parentPath)
      }
    }
  }
  
  // Second pass: build structure, skipping conflicting parent keys
  for (const key of sortedKeys) {
    // Skip parent keys that have children
    if (parentKeysWithChildren.has(key)) {
      skippedKeys.push(key)
      continue
    }
    
    const parts = key.split('.')
    let current = result
    let validPath = true
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      
      // If current[part] exists but is a string, we have a conflict
      if (current[part] && typeof current[part] === 'string') {
        conflicts.push({
          newKey: key,
          existingKey: current[part]
        })
        validPath = false
        break
      }
      
      if (!current[part]) {
        current[part] = {}
      }
      current = current[part]
    }
    
    if (validPath) {
      const lastPart = parts[parts.length - 1]
      current[lastPart] = key
    }
  }
  
  // Report conflicts at the end
  if (skippedKeys.length > 0) {
    console.log(`\n⚠️  Skipped ${skippedKeys.length} parent keys that have child keys:`)
    skippedKeys.slice(0, 10).forEach(key => {
      console.log(`   - ${key}`)
    })
    if (skippedKeys.length > 10) {
      console.log(`   ... and ${skippedKeys.length - 10} more`)
    }
  }
  
  if (conflicts.length > 0) {
    console.log(`\n⚠️  Found ${conflicts.length} key conflicts:`)
    conflicts.slice(0, 5).forEach(({newKey, existingKey}) => {
      console.log(`   - "${newKey}" conflicts with "${existingKey}"`)
    })
    if (conflicts.length > 5) {
      console.log(`   ... and ${conflicts.length - 5} more`)
    }
  }
  
  return result
}

/**
 * Generate TypeScript types from key structure
 */
function generateTranslationTypes(structure, keys, level = 0) {
  const indent = '  '.repeat(level)
  let result = ''
  
  if (level === 0) {
    result += `/**
 * Generated translation types
 * 
 * This file provides TypeScript interfaces for all translation keys
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

// All available translation keys as union type
export type TranslationKey = ${keys.map(k => `"${k.key}"`).join(' |\\n  ')}\n\n`

    result += `// Nested key structure for auto-completion\nexport interface TranslationKeyPath {\n`
  }
  
  for (const [key, value] of Object.entries(structure)) {
    if (typeof value === 'string') {
      result += `${indent}  "${key}": "${value}"\n`
    } else {
      result += `${indent}  "${key}": {\n`
      result += generateTranslationTypes(value, keys, level + 1)
      result += `${indent}  }\n`
    }
  }
  
  if (level === 0) {
    result += `}\n\n`
    result += `// Main translations interface\nexport interface Translations {\n`
    result += `  [key: string]: string\n`
    result += `}\n`
  }
  
  return result
}

/**
 * Generate TypeScript file for a specific language
 */
function generateLanguageFile(languageCode, translations, keys) {
  // Convert language code to valid JavaScript variable name
  const variableName = languageCode.replace(/-/g, '_')
  
  // Check if this is a regional locale (has a hyphen)
  const isRegionalLocale = languageCode.includes('-')
  
  const translationEntries = keys.map(key => {
    // Skip invalid keys
    if (!key.key || typeof key.key !== 'string') {
      console.warn(`Skipping invalid key: ${JSON.stringify(key)}`)
      return null
    }
    
    const value = translations[key.key]
    
    // For regional locales, only include keys that have actual values (overrides)
    // For base locales, include all keys with empty string fallback
    if (isRegionalLocale && (!value || value === '')) {
      return null
    }
    
    const actualValue = value || ''
    
    // Escape the key properly (in case it contains quotes)
    const escapedKey = key.key
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
    
    // Escape quotes and backslashes properly in the value
    const escapedValue = actualValue
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    
    return `  "${escapedKey}": "${escapedValue}"`
  }).filter(Boolean).join(',\n')
  
  return `/**
 * ${languageCode.toUpperCase()} translations
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

const ${variableName}: Translations = {
${translationEntries}
}

export default ${variableName}
`
}

/**
 * Generate index file
 */
function generateIndexFile(languages, translationData) {
  const imports = languages.map(lang => {
    const variableName = lang.code.replace(/-/g, '_')
    return `import ${variableName} from './${lang.code}'`
  }).join('\n')
  
  const languageCodes = languages.map(lang => `"${lang.code}"`).join(',\n  ')
  
  const translationsMap = languages.map(lang => {
    const variableName = lang.code.replace(/-/g, '_')
    return `  '${lang.code}': ${variableName}`
  }).join(',\n')
  
  const exports = languages.map(lang => {
    const variableName = lang.code.replace(/-/g, '_')
    // For exports, we need to handle the aliasing properly
    if (lang.code.includes('-')) {
      return `  ${variableName} as ${lang.code.replace(/-/g, '')}`
    }
    return `  ${variableName}`
  }).join(',\n')
  
  return `/**
 * Generated translation index file
 * 
 * This file provides easy access to all generated translation files
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

// Import all language files
${imports}

// Export language constants
export const AVAILABLE_LANGUAGES = [
  ${languageCodes}
] as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

// Export all translations in a map
export const translations: Record<AvailableLanguage, Translations> = {
${translationsMap}
}

// Export individual languages
export {
${exports}
}

// Export types
export type { Translations, TranslationKey, TranslationKeyPath } from './types'

/**
 * Get translations for a specific language
 */
export function getTranslations(language: AvailableLanguage): Translations {
  return translations[language]
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is AvailableLanguage {
  return AVAILABLE_LANGUAGES.includes(language as AvailableLanguage)
}
`
}

/**
 * Write generated files to disk
 */
function writeFiles(generatedContent, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  console.log(`📝 Writing TypeScript files to: ${outputDir}`)
  
  // Write types file
  fs.writeFileSync(path.join(outputDir, 'types.ts'), generatedContent.types)
  console.log(`  ✅ types.ts`)
  
  // Write language files
  for (const [languageCode, content] of Object.entries(generatedContent.languages)) {
    fs.writeFileSync(path.join(outputDir, `${languageCode}.ts`), content)
    console.log(`  ✅ ${languageCode}.ts`)
  }
  
  // Write index file
  fs.writeFileSync(path.join(outputDir, 'index.ts'), generatedContent.index)
  console.log(`  ✅ index.ts`)
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`🚀 Generating i18n TypeScript files...`)
    
    if (appArg) {
      console.log(`🎯 App filter: ${appArg}`)
    }
    
    console.log(`🌍 Environment: ${envArg}`)
    
    // Fetch translation data
    const translationData = await fetchTranslationData(appArg)
    
    // Generate TypeScript content
    console.log(`⚙️  Generating TypeScript files...`)
    const generatedContent = generateTypeScript(translationData)
    
    // Write files
    writeFiles(generatedContent, OUTPUT_DIR)
    
    console.log(`\\n🎉 Successfully generated i18n TypeScript files!`)
    console.log(`📁 Output directory: ${OUTPUT_DIR}`)
    console.log(`📊 Generated ${Object.keys(generatedContent.languages).length} language files`)
    
  } catch (error) {
    console.error(`\\n❌ Failed to generate i18n files:`, error)
    process.exit(1)
  }
}

// Run the script
main()
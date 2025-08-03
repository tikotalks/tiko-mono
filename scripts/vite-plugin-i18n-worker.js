/**
 * Vite Plugin for I18n Worker Integration
 * 
 * This plugin fetches translation data from the i18n-data worker during build
 * and generates static TypeScript files for runtime use.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default configuration
const DEFAULT_CONFIG = {
  workerUrl: {
    development: 'http://localhost:8787',
    production: 'https://i18n-data.silvandiepen.workers.dev'
  },
  outputDir: '../packages/ui/src/i18n/generated',
  environment: 'production', // Default to production for builds
  app: null // Optional app filter
}

/**
 * Create the Vite plugin
 */
export function i18nWorkerPlugin(userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig }
  const outputDir = path.resolve(__dirname, config.outputDir)
  
  return {
    name: 'i18n-worker',
    
    async buildStart() {
      console.log('🌍 [i18n-worker] Fetching translation data during build...')
      
      try {
        await generateTranslationsFromWorker(config, outputDir)
        console.log('✅ [i18n-worker] Translation files generated successfully')
      } catch (error) {
        // Don't fail the build, but warn about missing translations
        console.warn('⚠️ [i18n-worker] Failed to fetch translations from worker:', error.message)
        console.warn('⚠️ [i18n-worker] Using existing translation files if available')
        
        // Check if existing files are available
        if (!fs.existsSync(path.join(outputDir, 'index.ts'))) {
          console.error('❌ [i18n-worker] No existing translation files found. Build may fail.')
          throw new Error('Translation files are required but could not be generated or found')
        }
      }
    }
  }
}

/**
 * Generate translations from worker
 */
async function generateTranslationsFromWorker(config, outputDir) {
  const workerUrl = config.workerUrl[config.environment] || config.workerUrl.production
  const endpoint = config.app ? `/app/${config.app}` : '/all'
  const url = `${workerUrl}${endpoint}`
  
  console.log(`🌐 [i18n-worker] Fetching from: ${url}`)
  
  // Fetch translation data
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error from worker')
  }
  
  console.log(`📊 [i18n-worker] Fetched ${result.metadata.totalKeys} keys, ${result.metadata.totalLanguages} languages`)
  
  // Generate TypeScript content
  const generatedContent = generateTypeScript(result.data)
  
  // Write files
  writeFiles(generatedContent, outputDir)
}

/**
 * Generate TypeScript interface for translation keys
 */
function generateTypeScript(translationData) {
  const { keys, languages, translations } = translationData
  
  // Create nested key structure for type definitions
  const keyStructure = createKeyStructure(keys.map(k => k.key))
  
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
  
  for (const key of keys) {
    const parts = key.split('.')
    let current = result
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!current[part]) {
        current[part] = {}
      }
      current = current[part]
    }
    
    const lastPart = parts[parts.length - 1]
    current[lastPart] = key
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
export type TranslationKey = ${keys.map(k => `"${k.key}"`).join(' |\n  ')}\n\n`

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
  const translationEntries = keys.map(key => {
    const value = translations[key.key] || ''
    // Escape quotes and newlines
    const escapedValue = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
    
    return `  "${key.key}": "${escapedValue}"`
  }).join(',\n')
  
  return `/**
 * ${languageCode.toUpperCase()} translations
 * 
 * Generated on: ${new Date().toISOString()}
 * 
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

import type { Translations } from './types'

const ${languageCode}: Translations = {
${translationEntries}
}

export default ${languageCode}
`
}

/**
 * Generate index file
 */
function generateIndexFile(languages, translationData) {
  const imports = languages.map(lang => 
    `import ${lang.code} from './${lang.code}'`
  ).join('\n')
  
  const languageCodes = languages.map(lang => `"${lang.code}"`).join(',\n  ')
  
  const translationsMap = languages.map(lang => 
    `  '${lang.code}': ${lang.code}`
  ).join(',\n')
  
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
${languages.map(lang => `  ${lang.code} as ${lang.code}`).join(',\n')}
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
  
  console.log(`📝 [i18n-worker] Writing TypeScript files to: ${outputDir}`)
  
  // Write types file
  fs.writeFileSync(path.join(outputDir, 'types.ts'), generatedContent.types)
  
  // Write language files
  for (const [languageCode, content] of Object.entries(generatedContent.languages)) {
    fs.writeFileSync(path.join(outputDir, `${languageCode}.ts`), content)
  }
  
  // Write index file
  fs.writeFileSync(path.join(outputDir, 'index.ts'), generatedContent.index)
}

export default i18nWorkerPlugin
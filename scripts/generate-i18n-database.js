/**
 * Database-connected I18n Generator
 *
 * Generates static TypeScript translation files from the actual Supabase database.
 * This version works in Node.js environment using node-fetch.
 */

const fs = require('fs')
const path = require('path')

// Configuration for section filtering per app
const APP_SECTION_CONFIG = {
  'yes-no': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'timer': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'radio': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'cards': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'todo': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'type': {
    excluded: ['admin', 'deployment', 'media', 'content']
  },
  'admin': {
    // Admin includes everything
    excluded: []
  },
  'marketing': {
    excluded: ['admin', 'deployment']
  },
  'ui-docs': {
    excluded: ['admin', 'deployment', 'media', 'content']
  }
}

class DatabaseI18nGenerator {
  constructor(options = {}) {
    this.options = options
    this.baseOutputDir = options.outputDir || path.join(process.cwd(), 'packages/ui/src/i18n/generated')

    // Get environment variables
    this.supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    this.supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.')
      console.warn('💡 Falling back to mock data generation...')
      throw new Error('NO_SUPABASE_CONFIG')
    }

    this.baseUrl = this.supabaseUrl + '/rest/v1'

    // Import node-fetch dynamically to handle both CommonJS and ESM
    this.fetch = null
    this.initializeFetch()
  }

  async initializeFetch() {
    try {
      // Try to use global fetch (Node.js 18+)
      if (typeof fetch !== 'undefined') {
        this.fetch = fetch
      } else {
        // Fallback to node-fetch
        const { default: fetch } = await import('node-fetch')
        this.fetch = fetch
      }
    } catch (error) {
      console.error('Failed to initialize fetch. Please install node-fetch: npm install node-fetch')
      throw error
    }
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.fetch) {
      await this.initializeFetch()
    }

    const url = `${this.baseUrl}${endpoint}`

    const response = await this.fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Prefer': 'return=representation',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Supabase API Error: ${response.status} - ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getActiveLanguages() {
    return this.makeRequest('/i18n_languages?is_active=eq.true&order=name.asc')
  }

  async getTranslationKeys() {
    // Use Supabase with proper pagination
    this.log('📡 Fetching all translation keys with pagination...')
    return this.getAllKeysWithPagination()
  }

  async getAllKeysWithPagination() {
    let allKeys = []
    let offset = 0
    const limit = 1000
    let hasMore = true

    while (hasMore) {
      this.log(`📦 Fetching batch ${Math.floor(offset / limit) + 1} (offset: ${offset}, limit: ${limit})`)

      const keys = await this.makeRequest(`/i18n_keys?order=key.asc&limit=${limit}&offset=${offset}`)
      allKeys.push(...keys)

      this.log(`📦 Received ${keys.length} keys in this batch (total so far: ${allKeys.length})`)

      // If we got less than the limit, we're done
      hasMore = keys.length === limit
      offset += limit

      // Safety break to avoid infinite loops
      if (offset > 50000) {
        console.warn('⚠️ Stopping pagination at 50,000 records for safety')
        break
      }
    }

    this.log(`✅ Fetched ${allKeys.length} total keys with pagination`)
    return allKeys
  }

  async getTranslationsForLanguage(languageCode) {
    this.log(`Fetching translations for language: ${languageCode}`)

    let query = `/i18n_translations?select=i18n_keys(key),value,language_code&is_published=eq.true`

    // If locale has a region, fetch both base and specific in one query
    if (languageCode.includes('-')) {
      const baseLocale = languageCode.split('-')[0]
      query += `&language_code=in.(${baseLocale},${languageCode})`
    } else {
      query += `&language_code=eq.${languageCode}`
    }

    const translations = await this.makeRequest(query)

    // Process translations, merging base and specific locales
    const translationsByKey = {}
    const baseLocale = languageCode.includes('-') ? languageCode.split('-')[0] : null

    for (const translation of translations) {
      if (translation.i18n_keys && translation.i18n_keys.key) {
        const key = translation.i18n_keys.key

        if (!translationsByKey[key]) {
          translationsByKey[key] = {}
        }

        if (translation.language_code === baseLocale) {
          translationsByKey[key].base = translation.value
        } else {
          translationsByKey[key].specific = translation.value
        }
      }
    }

    // Merge translations: specific locale overrides base
    const mergedTranslations = {}
    for (const [key, values] of Object.entries(translationsByKey)) {
      mergedTranslations[key] = values.specific || values.base || ''
    }

    this.log(`Processed ${Object.keys(mergedTranslations).length} translations for ${languageCode}`)
    return mergedTranslations
  }

  async generate() {
    this.log('🌍 Starting database i18n generation...')

    try {
      // Get available languages
      const languages = await this.getTargetLanguages()
      this.log(`📋 Target languages: ${languages.join(', ')}`)

      // Get translation keys (filtered by app if specified)
      const allKeys = await this.getFilteredKeys()
      this.log(`🔑 Processing ${allKeys.length} translation keys`)

      // Ensure output directory exists
      this.ensureOutputDirectory()

      // Generate files for each language
      for (const language of languages) {
        await this.generateLanguageFile(language, allKeys)
      }

      // Generate TypeScript interfaces
      await this.generateInterfaces(allKeys)

      // Generate index file
      this.generateIndexFile(languages)

      // Generate app-specific export (if building for specific app)
      if (this.options.app) {
        this.generateAppExport(this.options.app, languages)
      }

      this.log('✅ Database i18n generation complete!')

    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  }

  async getTargetLanguages() {
    if (this.options.languages) {
      return this.options.languages
    }

    const activeLanguages = await this.getActiveLanguages()
    return activeLanguages.map(lang => lang.code)
  }

  async getFilteredKeys() {
    const allKeys = await this.getTranslationKeys()
    const keyStrings = allKeys.map(key => key.key)

    // Use options-based filtering first, then fallback to hardcoded config
    let includeSections = this.options.includeSections
    let excludeSections = this.options.excludeSections

    // If no direct options and we have an app name, check hardcoded config
    if (!includeSections && !excludeSections && this.options.app) {
      const config = APP_SECTION_CONFIG[this.options.app]
      if (config) {
        includeSections = config.included
        excludeSections = config.excluded
      }
    }

    // If no filtering options at all, return all keys
    if (!includeSections && !excludeSections) {
      this.log(`📦 No section filtering - including all ${keyStrings.length} keys`)
      return keyStrings
    }

    // Filter keys based on configuration
    let filteredKeys = keyStrings

    if (includeSections) {
      // Only include specified sections
      filteredKeys = keyStrings.filter(key =>
        includeSections.some(section => key.startsWith(`${section}.`))
      )
      this.log(`📦 Including sections: ${includeSections.join(', ')}`)
    }

    if (excludeSections) {
      // Exclude specified sections
      filteredKeys = filteredKeys.filter(key =>
        !excludeSections.some(section => key.startsWith(`${section}.`))
      )
      this.log(`🚫 Excluding sections: ${excludeSections.join(', ')}`)
    }

    const appName = this.options.app || 'current app'
    this.log(`🎯 Filtered ${keyStrings.length} → ${filteredKeys.length} keys for ${appName}`)
    return filteredKeys
  }

  async generateLanguageFile(language, keys) {
    this.log(`📝 Generating ${language}.ts...`)

    try {
      // Get translations for this language
      const allTranslations = await this.getTranslationsForLanguage(language)

      // Filter to only include our target keys
      const filteredTranslations = {}
      for (const key of keys) {
        if (allTranslations[key]) {
          filteredTranslations[key] = allTranslations[key]
        }
      }

      // Convert flat translations to nested structure
      const nestedTranslations = this.createNestedStructure(filteredTranslations)

      // Generate TypeScript content
      const content = this.generateTypeScriptContent(language, nestedTranslations)

      // Write file
      const outputPath = path.join(this.baseOutputDir, `${language}.ts`)
      fs.writeFileSync(outputPath, content, 'utf-8')

      this.log(`✅ Generated ${language}.ts (${Object.keys(filteredTranslations).length} keys)`)

    } catch (error) {
      console.error(`❌ Failed to generate ${language}.ts:`, error)
      throw error
    }
  }

  createNestedStructure(translations) {
    const result = {}

    translations: for (const [key, value] of Object.entries(translations)) {
      const parts = key.split('.')
      let current = result

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = {}
        }
        // If we encounter a string value where we expect an object, skip this translation
        if (typeof current[part] !== 'object') {
          console.warn(`Skipping translation ${key} - conflict at ${parts.slice(0, i + 1).join('.')}`)
          continue translations
        }
        current = current[part]
      }

      current[parts[parts.length - 1]] = value
    }

    return result
  }

  generateTypeScriptContent(language, translations) {
    const timestamp = new Date().toISOString()
    const app = this.options.app ? ` for app: ${this.options.app}` : ''

    return `/**
 * Generated translation file for ${language}${app}
 *
 * Generated on: ${timestamp}
 * Source: Tiko translation database
 *
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 * ⚠️  Changes will be overwritten on next generation
 *
 * To update translations:
 * 1. Edit translations in the admin dashboard
 * 2. Run: pnpm run generate:i18n
 */

import type { Translations } from './types'

const translations: Translations = ${JSON.stringify(translations, null, 2)}

export default translations
export type { Translations } from './types'
`
  }

  async generateInterfaces(keys) {
    this.log('🔧 Generating TypeScript interfaces...')

    try {
      // Get actual translations from a reference language (en-GB) to derive the real structure
      const referenceLanguage = 'en-GB'
      const actualTranslations = await this.getTranslationsForLanguage(referenceLanguage)

      // Filter to only include our target keys
      const filteredTranslations = {}
      for (const key of keys) {
        if (actualTranslations[key]) {
          filteredTranslations[key] = actualTranslations[key]
        }
      }

      // Convert to nested structure to get the real shape
      const nestedStructure = this.createNestedStructure(filteredTranslations)
      const interfaceContent = this.generateInterfaceContent(nestedStructure)

      const content = `/**
 * TypeScript interfaces for translation files
 *
 * Generated on: ${new Date().toISOString()}
 *
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export interface Translations {
${interfaceContent}
}

// Helper type for strongly typed translation keys
export type TranslationKey = ${keys.map(key => `'${key}'`).join(' | ')}

// Helper type for nested key access
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? \`\${Key}.\${NestedKeyOf<ObjectType[Key]>}\`
    : \`\${Key}\`
}[keyof ObjectType & (string | number)]

export type TranslationKeyPath = NestedKeyOf<Translations>
`

      const outputPath = path.join(this.baseOutputDir, 'types.ts')
      fs.writeFileSync(outputPath, content, 'utf-8')

      this.log('✅ Generated types.ts')
    } catch (error) {
      console.error('❌ Failed to generate interfaces:', error)
      // If we can't get actual translations, fall back to string types
      const sampleTranslations = {}
      keys.forEach((key) => {
        sampleTranslations[key] = 'string'
      })

      const nestedStructure = this.createNestedStructure(sampleTranslations)
      const interfaceContent = this.generateInterfaceContent(nestedStructure)

      const content = `/**
 * TypeScript interfaces for translation files
 *
 * Generated on: ${new Date().toISOString()}
 *
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export interface Translations {
${interfaceContent}
}

// Helper type for strongly typed translation keys
export type TranslationKey = ${keys.map(key => `'${key}'`).join(' | ')}

// Helper type for nested key access
export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? \`\${Key}.\${NestedKeyOf<ObjectType[Key]>}\`
    : \`\${Key}\`
}[keyof ObjectType & (string | number)]

export type TranslationKeyPath = NestedKeyOf<Translations>
`

      const outputPath = path.join(this.baseOutputDir, 'types.ts')
      fs.writeFileSync(outputPath, content, 'utf-8')

      this.log('⚠️  Generated types.ts with fallback structure')
    }
  }

  generateInterfaceContent(obj, indent = '  ') {
    const lines = []

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        lines.push(`${indent}${key}: string`)
      } else {
        lines.push(`${indent}${key}: {`)
        lines.push(this.generateInterfaceContent(value, indent + '  '))
        lines.push(`${indent}}`)
      }
    }

    return lines.join('\n')
  }

  generateIndexFile(languages) {
    this.log('📇 Generating index.ts...')

    const content = `/**
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
${languages.map((lang) =>
  `import ${lang.replace('-', '_')} from './${lang}'`
).join('\n')}

// Export language constants
export const AVAILABLE_LANGUAGES = ${JSON.stringify(languages, null, 2)} as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

// Export all translations in a map
export const translations: Record<AvailableLanguage, Translations> = {
${languages.map((lang) => `  '${lang}': ${lang.replace('-', '_')}`).join(',\n')}
}

// Export individual languages
export {
${languages.map((lang) => `  ${lang.replace('-', '_')} as ${lang.replace('-', '_')}`).join(',\n')}
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

    const outputPath = path.join(this.baseOutputDir, 'index.ts')
    fs.writeFileSync(outputPath, content, 'utf-8')

    this.log('✅ Generated index.ts')
  }

  generateAppExport(app, languages) {
    this.log(`📱 Generating app export for ${app}...`)

    const content = `/**
 * App-specific translations export for ${app}
 *
 * This file is optimized for the ${app} app and only contains
 * relevant translation sections.
 *
 * Generated on: ${new Date().toISOString()}
 *
 * ⚠️  DO NOT EDIT MANUALLY - This file is auto-generated
 */

export {
  translations,
  getTranslations,
  isLanguageSupported,
  AVAILABLE_LANGUAGES
} from './index'

export type {
  Translations,
  TranslationKey,
  TranslationKeyPath,
  AvailableLanguage
} from './index'

// App-specific re-exports for convenience
export const APP_NAME = '${app}'
export const APP_TRANSLATIONS = translations
`

    const outputPath = path.join(this.baseOutputDir, `${app}.ts`)
    fs.writeFileSync(outputPath, content, 'utf-8')

    this.log(`✅ Generated ${app}.ts`)
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.baseOutputDir)) {
      fs.mkdirSync(this.baseOutputDir, { recursive: true })
      this.log(`📁 Created output directory: ${this.baseOutputDir}`)
    }

    // Create .gitignore to exclude generated files
    const gitignorePath = path.join(this.baseOutputDir, '.gitignore')
    const gitignoreContent = `# Auto-generated translation files
# These files are generated from the database and should not be committed

*.ts
*.js
*.d.ts
!.gitignore

# Keep this directory but ignore all generated content
`

    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8')
  }

  log(message) {
    if (this.options.verbose !== false) {
      console.log(message)
    }
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}

  for (const arg of args) {
    if (arg.startsWith('--app=')) {
      options.app = arg.split('=')[1]
    } else if (arg.startsWith('--languages=')) {
      options.languages = arg.split('=')[1].split(',')
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1]
    } else if (arg === '--production') {
      options.production = true
    } else if (arg === '--verbose') {
      options.verbose = true
    } else if (arg === '--quiet') {
      options.verbose = false
    }
  }

  return options
}

// Main execution
async function main() {
  const options = parseArgs()
  const generator = new DatabaseI18nGenerator(options)
  await generator.generate()
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Generation failed:', error)
    process.exit(1)
  })
}

module.exports = { DatabaseI18nGenerator }

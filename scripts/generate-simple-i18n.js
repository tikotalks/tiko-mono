
/**
 * Simple I18n Generator
 * 
 * Generates static TypeScript translation files for apps.
 * This is a simplified version that works around TypeScript/ESM issues.
 */

const fs = require('fs')
const path = require('path')

// Mock translation data for testing
const MOCK_LANGUAGES = ['en', 'en-GB', 'en-US', 'nl', 'nl-NL', 'nl-BE', 'fr', 'fr-FR', 'fr-BE', 'de', 'de-DE', 'de-AT', 'de-CH']

const MOCK_TRANSLATIONS = {
  'common.save': {
    en: 'Save',
    nl: 'Opslaan',
    fr: 'Enregistrer',
    de: 'Speichern'
  },
  'common.cancel': {
    en: 'Cancel',
    nl: 'Annuleren',
    fr: 'Annuler',
    de: 'Abbrechen'
  },
  'common.loading': {
    en: 'Loading...',
    nl: 'Laden...',
    fr: 'Chargement...',
    de: 'Laden...'
  },
  'timer.start': {
    en: 'Start Timer',
    nl: 'Timer Starten',
    fr: 'Démarrer le minuteur',
    de: 'Timer starten'
  },
  'timer.pause': {
    en: 'Pause',
    nl: 'Pauzeren',
    fr: 'Pause',
    de: 'Pausieren'
  },
  'timer.reset': {
    en: 'Reset',
    nl: 'Reset',
    fr: 'Réinitialiser',
    de: 'Zurücksetzen'
  },
  'admin.users': {
    en: 'Users',
    nl: 'Gebruikers',
    fr: 'Utilisateurs',
    de: 'Benutzer'
  },
  'admin.settings': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
    de: 'Einstellungen'
  }
}

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

class SimpleLanguageFileGenerator {
  constructor(options = {}) {
    this.options = options
    this.baseOutputDir = options.outputDir || path.join(process.cwd(), 'packages/ui/src/i18n/generated')
  }

  async generate() {
    this.log('🌍 Starting simple language file generation...')

    try {
      // Get available languages
      const languages = this.getTargetLanguages()
      this.log(`📋 Target languages: ${languages.join(', ')}`)

      // Get translation keys (filtered by app if specified)
      const allKeys = this.getFilteredKeys()
      this.log(`🔑 Processing ${allKeys.length} translation keys`)

      // Ensure output directory exists
      this.ensureOutputDirectory()

      // Generate files for each language
      for (const language of languages) {
        this.generateLanguageFile(language, allKeys)
      }

      // Generate TypeScript interfaces
      this.generateInterfaces(allKeys)

      // Generate index file
      this.generateIndexFile(languages)

      // Generate app-specific export (if building for specific app)
      if (this.options.app) {
        this.generateAppExport(this.options.app, languages)
      }

      this.log('✅ Language file generation complete!')

    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  }

  getTargetLanguages() {
    if (this.options.languages) {
      return this.options.languages
    }
    return MOCK_LANGUAGES
  }

  getFilteredKeys() {
    const allKeys = Object.keys(MOCK_TRANSLATIONS)

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
      this.log(`📦 No section filtering - including all ${allKeys.length} keys`)
      return allKeys
    }

    // Filter keys based on configuration
    let filteredKeys = allKeys

    if (includeSections) {
      // Only include specified sections
      filteredKeys = allKeys.filter(key => 
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
    this.log(`🎯 Filtered ${allKeys.length} → ${filteredKeys.length} keys for ${appName}`)
    return filteredKeys
  }

  generateLanguageFile(language, keys) {
    this.log(`📝 Generating ${language}.ts...`)

    try {
      // Get translations for this language
      const filteredTranslations = {}
      for (const key of keys) {
        if (MOCK_TRANSLATIONS[key] && MOCK_TRANSLATIONS[key][language]) {
          filteredTranslations[key] = MOCK_TRANSLATIONS[key][language]
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

    for (const [key, value] of Object.entries(translations)) {
      const parts = key.split('.')
      let current = result

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        if (!current[part]) {
          current[part] = {}
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

  generateInterfaces(keys) {
    this.log('🔧 Generating TypeScript interfaces...')

    // Create a sample nested structure to derive types
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

    this.log('✅ Generated types.ts')
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
  const generator = new SimpleLanguageFileGenerator(options)
  await generator.generate()
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Generation failed:', error)
    process.exit(1)
  })
}

module.exports = { SimpleLanguageFileGenerator }
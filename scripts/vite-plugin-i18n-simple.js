/**
 * Simple Vite Plugin for I18n Generation
 * 
 * This plugin automatically generates translation files during the build process
 * for specific apps.
 */

import fs from 'fs'
import path from 'path'

// Import the database generator for actual data
// Dynamic import to avoid ESM/CJS conflicts in vite
let DatabaseI18nGenerator
try {
  const module = require('./generate-i18n-database.js')
  DatabaseI18nGenerator = module.DatabaseI18nGenerator
} catch (error) {
  // Fallback if require fails in ESM context
  DatabaseI18nGenerator = null
}

// Mock translation data for testing
const MOCK_LANGUAGES = ['en', 'nl', 'fr', 'de']

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
  'common.settings': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
    de: 'Einstellungen'
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
  },
  'auth.preparingApp': {
    en: 'Preparing app...',
    nl: 'App voorbereiden...',
    fr: 'Préparation de l\'application...',
    de: 'App wird vorbereitet...'
  },
  'auth.logout': {
    en: 'Logout',
    nl: 'Uitloggen',
    fr: 'Déconnexion',
    de: 'Abmelden'
  },
  'common.menu': {
    en: 'Menu',
    nl: 'Menu',
    fr: 'Menu',
    de: 'Menü'
  },
  'profile.title': {
    en: 'Profile',
    nl: 'Profiel',
    fr: 'Profil',
    de: 'Profil'
  },
  'settings.title': {
    en: 'Settings',
    nl: 'Instellingen',
    fr: 'Paramètres',
    de: 'Einstellungen'
  },
  'settings.userSettings': {
    en: 'User Settings',
    nl: 'Gebruikersinstellingen',
    fr: 'Paramètres utilisateur',
    de: 'Benutzereinstellungen'
  },
  'parentMode.parentMode': {
    en: 'Parent Mode',
    nl: 'Oudermodus',
    fr: 'Mode parent',
    de: 'Elternmodus'
  },
  'parentMode.setUpParentMode': {
    en: 'Set Up Parent Mode',
    nl: 'Oudermodus instellen',
    fr: 'Configurer le mode parent',
    de: 'Elternmodus einrichten'
  },
  'parentMode.createPinDescription': {
    en: 'Create a 4-digit PIN to protect parent settings',
    nl: 'Maak een 4-cijferige PIN om ouderinstellingen te beschermen',
    fr: 'Créez un code PIN à 4 chiffres pour protéger les paramètres parentaux',
    de: 'Erstellen Sie eine 4-stellige PIN zum Schutz der Elterneinstellungen'
  },
  'parentMode.enterParentPin': {
    en: 'Enter Parent PIN',
    nl: 'Voer ouder-PIN in',
    fr: 'Entrez le code PIN parent',
    de: 'Eltern-PIN eingeben'
  },
  'parentMode.enterPinDescription': {
    en: 'Enter your PIN to access parent settings',
    nl: 'Voer uw PIN in om toegang te krijgen tot ouderinstellingen',
    fr: 'Entrez votre code PIN pour accéder aux paramètres parentaux',
    de: 'Geben Sie Ihre PIN ein, um auf die Elterneinstellungen zuzugreifen'
  },
  'common.dashboard': {
    en: 'Dashboard',
    nl: 'Dashboard',
    fr: 'Tableau de bord',
    de: 'Dashboard'
  },
  'admin.dashboard.description': {
    en: 'Overview of your system',
    nl: 'Overzicht van uw systeem',
    fr: 'Aperçu de votre système',
    de: 'Übersicht über Ihr System'
  },
  'admin.dashboard.users': {
    en: 'Users',
    nl: 'Gebruikers',
    fr: 'Utilisateurs',
    de: 'Benutzer'
  },
  'admin.dashboard.totalUsers': {
    en: 'Total Users',
    nl: 'Totaal gebruikers',
    fr: 'Total des utilisateurs',
    de: 'Gesamtbenutzer'
  },
  'admin.navigation.dashboard': {
    en: 'Dashboard',
    nl: 'Dashboard',
    fr: 'Tableau de bord',
    de: 'Dashboard'
  },
  'admin.navigation.media': {
    en: 'Media',
    nl: 'Media',
    fr: 'Médias',
    de: 'Medien'
  },
  'admin.navigation.library': {
    en: 'Library',
    nl: 'Bibliotheek',
    fr: 'Bibliothèque',
    de: 'Bibliothek'
  },
  'admin.navigation.upload': {
    en: 'Upload',
    nl: 'Uploaden',
    fr: 'Télécharger',
    de: 'Hochladen'
  },
  'admin.navigation.users': {
    en: 'Users',
    nl: 'Gebruikers',
    fr: 'Utilisateurs',
    de: 'Benutzer'
  },
  'admin.navigation.i18n.title': {
    en: 'Translations',
    nl: 'Vertalingen',
    fr: 'Traductions',
    de: 'Übersetzungen'
  },
  'admin.navigation.i18n.addKey': {
    en: 'Add Key',
    nl: 'Sleutel toevoegen',
    fr: 'Ajouter une clé',
    de: 'Schlüssel hinzufügen'
  },
  'admin.navigation.i18nDatabase': {
    en: 'Database',
    nl: 'Database',
    fr: 'Base de données',
    de: 'Datenbank'
  },
  'admin.navigation.i18n.import': {
    en: 'Import',
    nl: 'Importeren',
    fr: 'Importer',
    de: 'Importieren'
  },
  'admin.navigation.i18nLanguages': {
    en: 'Languages',
    nl: 'Talen',
    fr: 'Langues',
    de: 'Sprachen'
  },
  'admin.navigation.content.title': {
    en: 'Content',
    nl: 'Inhoud',
    fr: 'Contenu',
    de: 'Inhalt'
  },
  'admin.navigation.content.projects': {
    en: 'Projects',
    nl: 'Projecten',
    fr: 'Projets',
    de: 'Projekte'
  },
  'admin.navigation.content.sections': {
    en: 'Sections',
    nl: 'Secties',
    fr: 'Sections',
    de: 'Abschnitte'
  },
  'admin.navigation.content.pages': {
    en: 'Pages',
    nl: 'Pagina\'s',
    fr: 'Pages',
    de: 'Seiten'
  },
  'admin.navigation.deployment': {
    en: 'Deployment',
    nl: 'Deployment',
    fr: 'Déploiement',
    de: 'Bereitstellung'
  },
  'admin.navigation.deploymentBackups': {
    en: 'Backups',
    nl: 'Backups',
    fr: 'Sauvegardes',
    de: 'Sicherungen'
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

function createNestedStructure(translations) {
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

function generateTypeScriptContent(language, translations, app) {
  const timestamp = new Date().toISOString()
  const appSuffix = app ? ` for app: ${app}` : ''
  
  return `/**
 * Generated translation file for ${language}${appSuffix}
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

function generateInterfaces(keys) {
  // Create a sample nested structure to derive types
  const sampleTranslations = {}
  keys.forEach((key) => {
    sampleTranslations[key] = 'string'
  })

  const nestedStructure = createNestedStructure(sampleTranslations)
  const interfaceContent = generateInterfaceContent(nestedStructure)

  return `/**
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
}

function generateInterfaceContent(obj, indent = '  ') {
  const lines = []

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      lines.push(`${indent}${key}: string`)
    } else {
      lines.push(`${indent}${key}: {`)
      lines.push(generateInterfaceContent(value, indent + '  '))
      lines.push(`${indent}}`)
    }
  }

  return lines.join('\n')
}

function generateIndexFile(languages) {
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
}

async function generateI18nFiles(options = {}) {
  // Try to use database generator first, fallback to mock data
  try {
    if (DatabaseI18nGenerator && process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLIC) {
      const generator = new DatabaseI18nGenerator({
        ...options,
        verbose: options.verbose !== false
      })
      await generator.generate()
      return
    }
  } catch (error) {
    console.warn('❌ Database generation failed, falling back to mock data:', error.message)
  }
  
  // Fallback to mock data generation
  const baseOutputDir = path.join(process.cwd(), 'packages/ui/src/i18n/generated')
  
  // Get languages
  const languages = options.languages || MOCK_LANGUAGES
  
  // Get all keys
  const allKeys = Object.keys(MOCK_TRANSLATIONS)
  
  // Filter keys based on app configuration
  let filteredKeys = allKeys
  
  if (options.app && APP_SECTION_CONFIG[options.app]) {
    const config = APP_SECTION_CONFIG[options.app]
    if (config.excluded) {
      filteredKeys = allKeys.filter(key => 
        !config.excluded.some(section => key.startsWith(`${section}.`))
      )
    }
  }
  
  // Ensure output directory exists
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true })
  }
  
  // Generate files for each language
  for (const language of languages) {
    const filteredTranslations = {}
    for (const key of filteredKeys) {
      if (MOCK_TRANSLATIONS[key] && MOCK_TRANSLATIONS[key][language]) {
        filteredTranslations[key] = MOCK_TRANSLATIONS[key][language]
      }
    }
    
    const nestedTranslations = createNestedStructure(filteredTranslations)
    const content = generateTypeScriptContent(language, nestedTranslations, options.app)
    
    const outputPath = path.join(baseOutputDir, `${language}.ts`)
    fs.writeFileSync(outputPath, content, 'utf-8')
  }
  
  // Generate types
  const typesContent = generateInterfaces(filteredKeys)
  const typesPath = path.join(baseOutputDir, 'types.ts')
  fs.writeFileSync(typesPath, typesContent, 'utf-8')
  
  // Generate index
  const indexContent = generateIndexFile(languages)
  const indexPath = path.join(baseOutputDir, 'index.ts')
  fs.writeFileSync(indexPath, indexContent, 'utf-8')
  
  // Generate .gitignore
  const gitignorePath = path.join(baseOutputDir, '.gitignore')
  const gitignoreContent = `# Auto-generated translation files
# These files are generated from the database and should not be committed

*.ts
*.js
*.d.ts
!.gitignore

# Keep this directory but ignore all generated content
`
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8')
  
  if (options.verbose !== false) {
    console.log(`🌍 Generated i18n files for ${options.app || 'app'} with ${filteredKeys.length} keys (using mock data)`)
  }
}

/**
 * @param {Object} options
 * @returns {import('vite').Plugin}
 */
export function i18nGeneration(options = {}) {
  let hasGenerated = false
  
  return {
    name: 'i18n-generation',
    
    async configResolved() {
      // Generate files once during config resolution
      if (!hasGenerated) {
        try {
          await generateI18nFiles(options)
          hasGenerated = true
        } catch (error) {
          console.warn('❌ I18n generation failed:', error.message)
        }
      }
    }
  }
}

/**
 * Create a simplified plugin for apps that just need basic i18n generation
 * @param {string|Object} appNameOrOptions - App name or full options object
 * @returns {import('vite').Plugin}
 */
export function createAppI18nPlugin(appNameOrOptions) {
  const options = typeof appNameOrOptions === 'string' 
    ? { app: appNameOrOptions, verbose: false }
    : { verbose: false, ...appNameOrOptions }
  
  return i18nGeneration(options)
}
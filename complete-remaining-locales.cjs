#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the complete en-GB locale file as reference
const enGBPath = path.join(__dirname, 'packages/ui/src/i18n/locales/en-GB.ts')
const enGBContent = fs.readFileSync(enGBPath, 'utf8')

// Extract the translation object content from en-GB file
const enGBTranslationMatch = enGBContent.match(/export const enGB: TranslationSchema = ({[\s\S]*})\s*$/m)
if (!enGBTranslationMatch) {
  console.error('Could not parse en-GB file structure')
  process.exit(1)
}

const enGBTranslations = enGBTranslationMatch[1]

// List of locale files to complete
const locales = [
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'sv', name: 'Swedish' }
]

for (const locale of locales) {
  const localePath = path.join(__dirname, `packages/ui/src/i18n/locales/${locale.code}.ts`)
  
  if (!fs.existsSync(localePath)) {
    console.log(`Skipping ${locale.name} - file does not exist`)
    continue
  }

  const localeContent = fs.readFileSync(localePath, 'utf8')
  
  // Extract existing translations
  const localeTranslationMatch = localeContent.match(new RegExp(`export const ${locale.code}: TranslationSchema = ({[\\s\\S]*})\\s*$`, 'm'))
  if (!localeTranslationMatch) {
    console.error(`Could not parse ${locale.name} file structure`)
    continue
  }

  // Create complete structure based on en-GB but with TODO placeholders
  let completeTranslations = enGBTranslations
    // Replace all English strings with TODO placeholders
    .replace(/: '[^']*'/g, `: '[TODO: Translate to ${locale.name}]'`)
    .replace(/: "[^"]*"/g, `: "[TODO: Translate to ${locale.name}]"`)
    
  // Keep URLs and technical strings as-is by restoring them from original
  completeTranslations = completeTranslations.replace(/: '\[TODO: Translate to [^\]]+\]'/g, function(match, offset, string) {
    // Find the key for this value
    const beforeMatch = string.substring(0, offset)
    const keyMatch = beforeMatch.match(/(\w+):\s*$/)
    if (keyMatch) {
      const key = keyMatch[1]
      // Keep certain technical keys unchanged
      if (key === 'thumbnailPlaceholder' || key.includes('Url') || key.includes('Placeholder')) {
        // Find the original English value
        const originalMatch = enGBTranslations.match(new RegExp(key + ':\\s*[\'"][^\'"]*[\'"]'))
        if (originalMatch) {
          return ': ' + originalMatch[0].split(': ')[1]
        }
      }
    }
    return match
  })

  // Parse existing translations to preserve them
  const existingTranslations = localeTranslationMatch[1]
  
  // Extract major sections and preserve existing translations
  const sections = [
    'common', 'auth', 'settings', 'timer', 'cards', 'type', 'yesno', 'todo', 
    'radio', 'parentMode', 'profile', 'tiko', 'signin', 'sso', 'validation', 'uiDocs'
  ]

  for (const section of sections) {
    // More robust regex to handle nested objects like errors: { ... }
    const sectionRegex = new RegExp(`${section}:\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, 's')
    const existingSectionMatch = existingTranslations.match(sectionRegex)
    
    if (existingSectionMatch) {
      const existingSectionContent = `${section}: {${existingSectionMatch[1]}}`
      // Replace the corresponding section in the complete structure
      completeTranslations = completeTranslations.replace(
        new RegExp(`${section}:\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, 's'),
        existingSectionContent
      )
    }
  }

  // Create the new locale file content
  const newLocaleContent = `import type { TranslationSchema } from '../types'

// ${locale.name} translations
export const ${locale.code}: TranslationSchema = ${completeTranslations}
`

  // Write the updated locale file
  fs.writeFileSync(localePath, newLocaleContent, 'utf8')
  console.log(`${locale.name} locale file updated with all missing keys while preserving existing translations`)
}
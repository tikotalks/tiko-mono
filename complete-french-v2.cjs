#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the complete en-GB locale file as reference
const enGBPath = path.join(__dirname, 'packages/ui/src/i18n/locales/en-GB.ts')
const frPath = path.join(__dirname, 'packages/ui/src/i18n/locales/fr.ts')

let enGBContent = fs.readFileSync(enGBPath, 'utf8')
let frContent = fs.readFileSync(frPath, 'utf8')

// Extract the translation object content from en-GB file
const enGBTranslationMatch = enGBContent.match(/export const enGB: TranslationSchema = ({[\s\S]*})\s*$/m)
if (!enGBTranslationMatch) {
  console.error('Could not parse en-GB file structure')
  process.exit(1)
}

const enGBTranslations = enGBTranslationMatch[1]

// Extract existing French translations
const frTranslationMatch = frContent.match(/export const fr: TranslationSchema = ({[\s\S]*})\s*$/m)
if (!frTranslationMatch) {
  console.error('Could not parse French file structure')
  process.exit(1)
}

// Parse the en-GB structure but keep existing French translations where they exist
let frTranslations = enGBTranslations
  // First, convert all English strings to French TODO placeholders
  .replace(/: '[^']*'/g, ": '[TODO: Translate to French]'")
  .replace(/: "[^"]*"/g, ': "[TODO: Translate to French]"')
  
  // Keep URLs and technical strings as-is
  .replace(/: '\[TODO: Translate to French\]'/g, function(match, offset, string) {
    // Find the key for this value
    const beforeMatch = string.substring(0, offset)
    const keyMatch = beforeMatch.match(/(\w+):\s*$/)
    if (keyMatch) {
      const key = keyMatch[1]
      // Keep certain technical keys unchanged
      if (key === 'thumbnailPlaceholder' || key.includes('Url') || key.includes('placeholder')) {
        // Find the original English value
        const originalMatch = enGBTranslations.match(new RegExp(key + ':\\s*[\'"][^\'"]*[\'"]'))
        if (originalMatch) {
          return ': ' + originalMatch[0].split(': ')[1]
        }
      }
    }
    return match
  })

// Now overlay existing French translations
const existingFrTranslations = frTranslationMatch[1]

// Simple approach: replace the existing sections with French content
// This preserves all existing French translations
const sections = ['common', 'auth', 'settings', 'timer', 'cards', 'type', 'yesno', 'todo', 'radio', 'parentMode', 'profile', 'tiko', 'signin', 'sso']

for (const section of sections) {
  const frSectionMatch = existingFrTranslations.match(new RegExp(`${section}:\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, 's'))
  if (frSectionMatch) {
    const frSectionContent = `${section}: {${frSectionMatch[1]}}`
    // Replace the corresponding section in the new structure
    frTranslations = frTranslations.replace(
      new RegExp(`${section}:\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, 's'),
      frSectionContent
    )
  }
}

// Create the new French file content
const newFrContent = `import type { TranslationSchema } from '../types'

// French translations
export const fr: TranslationSchema = ${frTranslations}
`

// Write the updated French file
fs.writeFileSync(frPath, newFrContent, 'utf8')
console.log('French locale file updated with all missing keys while preserving existing translations')
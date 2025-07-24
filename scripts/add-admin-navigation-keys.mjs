#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

// New keys to add
const navigationKeys = {
  dashboard: 'Dashboard',
  library: 'Library',
  libraryImages: 'Images',
  libraryCategories: 'Categories'
}

const settingsKey = 'Settings'

async function addKeysToLanguageFile(language) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    let modified = false
    
    // Skip if already has navigation (English and Dutch already have it)
    if (content.includes('navigation: {')) {
      console.log(`⚪ ${language}.ts already has navigation keys`)
      return false
    }
    
    // Find the admin section and add navigation after library
    const adminPattern = /(library:\s*\{[^}]*\})(.*?)(\s*\}\s*\})/s
    const match = content.match(adminPattern)
    
    if (match) {
      // Build the new section with navigation and settings
      const navigationSection = `,
    navigation: {
      dashboard: 'TODO: Translate',
      library: 'TODO: Translate',
      libraryImages: 'TODO: Translate',
      libraryCategories: 'TODO: Translate'
    },
    settings: 'TODO: Translate'`
      
      // Replace with library section + navigation + rest
      content = content.replace(adminPattern, match[1] + navigationSection + match[3])
      
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`✅ Added navigation keys to ${language}.ts`)
      return true
    }
    
    console.error(`❌ Could not find admin section in ${language}.ts`)
    return false
    
  } catch (error) {
    console.error(`❌ Error updating ${language}.ts:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Adding admin navigation keys to all language files...')
  
  try {
    const files = await fs.readdir(BASE_LOCALES_DIR)
    const languages = files
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''))
      .sort()
    
    let updatedCount = 0
    for (const language of languages) {
      const success = await addKeysToLanguageFile(language)
      if (success) {
        updatedCount++
      }
    }
    
    console.log(`\n✅ Updated ${updatedCount}/${languages.length} language files`)
    console.log('💡 Run "pnpm check:i18n" to validate the translations')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

main()
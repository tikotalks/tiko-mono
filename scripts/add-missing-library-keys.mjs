#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

// New keys to add
const newKeys = {
  'admin.library.searchPlaceholder': 'Search by title, description, tags, or categories...',
  'admin.library.uploadFirst': 'Upload Your First Image',
  'admin.library.totalImages': 'Total Images'
}

async function addKeysToLanguageFile(language) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    let modified = false
    
    // Find the library section and add missing keys
    const libraryRegex = /(library:\s*\{[^}]*)(.*?)(\s*\})/s
    const match = content.match(libraryRegex)
    
    if (match) {
      let librarySection = match[1] + match[2]
      
      // Add missing keys
      for (const [key, defaultValue] of Object.entries(newKeys)) {
        const keyName = key.split('.').pop() // Get the last part (e.g., 'searchPlaceholder')
        if (!librarySection.includes(`${keyName}:`)) {
          const value = language === 'en' ? defaultValue : 'TODO: Translate'
          librarySection += `\n      ${keyName}: '${value}',`
          modified = true
        }
      }
      
      if (modified) {
        content = content.replace(libraryRegex, librarySection + match[3])
        await fs.writeFile(filePath, content, 'utf8')
        console.log(`✅ Added missing keys to ${language}.ts`)
        return true
      }
    }
    
    console.log(`⚪ No missing keys in ${language}.ts`)
    return false
    
  } catch (error) {
    console.error(`❌ Error updating ${language}.ts:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Adding missing library keys to all language files...')
  
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
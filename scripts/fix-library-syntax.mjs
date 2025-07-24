#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function fixLanguageFile(language) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    let fixed = false
    
    // Fix the malformed library section
    // Pattern: look for library section and fix the syntax
    const libraryPattern = /library:\s*\{([^}]*noImages:[^,\n]*)(.*?)(searchPlaceholder:[^}]*)\}/s
    
    if (content.match(libraryPattern)) {
      // Replace with properly formatted library section
      const properLibrarySection = `library: {
      title: 'TODO: Translate',
      search: 'TODO: Translate',
      searchPlaceholder: 'TODO: Translate',
      filter: 'TODO: Translate',
      category: 'TODO: Translate',
      tags: 'TODO: Translate',
      noImages: 'TODO: Translate',
      uploadFirst: 'TODO: Translate',
      totalImages: 'TODO: Translate'
    }`
      
      // For English and Dutch, use proper translations
      if (language === 'en') {
        content = content.replace(libraryPattern, `library: {
      title: 'Media Library',
      search: 'Search media...',
      searchPlaceholder: 'Search by title, description, tags, or categories...',
      filter: 'Filter by',
      category: 'Category',
      tags: 'Tags',
      noImages: 'No images found',
      uploadFirst: 'Upload Your First Image',
      totalImages: 'Total Images'
    }`)
        fixed = true
      } else if (language === 'nl') {
        content = content.replace(libraryPattern, `library: {
      title: 'Mediabibliotheek',
      search: 'Zoek media...',
      searchPlaceholder: 'Zoek op titel, beschrijving, tags of categorieën...',
      filter: 'Filter op',
      category: 'Categorie',
      tags: 'Tags',
      noImages: 'Geen afbeeldingen gevonden',
      uploadFirst: 'Upload je eerste afbeelding',
      totalImages: 'Totaal aantal afbeeldingen'
    }`)
        fixed = true
      } else {
        content = content.replace(libraryPattern, properLibrarySection)
        fixed = true
      }
    }
    
    if (fixed) {
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`✅ Fixed syntax errors in ${language}.ts`)
      return true
    } else {
      console.log(`⚪ No syntax errors found in ${language}.ts`)
      return false
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${language}.ts:`, error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Fixing library syntax errors in all language files...')
  
  try {
    const files = await fs.readdir(BASE_LOCALES_DIR)
    const languages = files
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''))
      .sort()
    
    let fixedCount = 0
    for (const language of languages) {
      const success = await fixLanguageFile(language)
      if (success) {
        fixedCount++
      }
    }
    
    console.log(`\n✅ Fixed syntax errors in ${fixedCount}/${languages.length} language files`)
    console.log('💡 Run "pnpm check:i18n" to validate the fixes')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

main()
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
    
    // Remove malformed lines like "    media.filename: 'Bestandsnaam',"
    if (content.includes('media.filename:')) {
      content = content.replace(/^\s*media\.filename:.*$/gm, '')
      fixed = true
    }
    
    // Remove extra commas like "},,," or "},,,,"
    if (content.match(/\},,,+/)) {
      content = content.replace(/\},,,+/g, '},')
      fixed = true
    }
    
    // Remove extra spaces before media sections like "},         media: {"
    if (content.match(/\},\s+media:\s*\{/)) {
      content = content.replace(/\},\s+media:\s*\{/g, '},\n    media: {')
      fixed = true
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
  console.log('🔧 Fixing syntax errors in all language files...')
  
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
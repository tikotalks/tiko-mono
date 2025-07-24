#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')
const KEYS_FILE = path.join(__dirname, '../packages/ui/src/i18n/keys.ts')
const TYPES_FILE = path.join(__dirname, '../packages/ui/src/i18n/types.ts')

async function cleanupFile(filePath, fileName) {
  try {
    let content = await fs.readFile(filePath, 'utf8')
    
    // Remove duplicate entries like "login.title:" inside login object
    // This regex finds patterns like "    login.title: 'value'," inside a login: { } block
    content = content.replace(/(\s+)login\.(title|subtitle|emailPlaceholder|passwordPlaceholder|accessInfo|noPermission):\s*['"`][^'"`]*['"`],?\n/g, '')
    
    // Also clean up the types file
    if (fileName === 'types.ts') {
      content = content.replace(/(\s+)login\.(title|subtitle|emailPlaceholder|passwordPlaceholder|accessInfo|noPermission):\s*string\n/g, '')
    }
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ Cleaned up ${fileName}`)
  } catch (error) {
    console.error(`❌ Error cleaning up ${fileName}:`, error.message)
  }
}

async function main() {
  console.log('🧹 Cleaning up duplicate i18n entries...\n')
  
  // Clean up types.ts
  await cleanupFile(TYPES_FILE, 'types.ts')
  
  // Clean up keys.ts
  await cleanupFile(KEYS_FILE, 'keys.ts')
  
  // Clean up all language files
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const languageFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of languageFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    await cleanupFile(filePath, file)
  }
  
  console.log('\n✅ Cleanup complete!')
}

main().catch(console.error)
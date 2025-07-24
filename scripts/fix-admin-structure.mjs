#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function fixAdminStructure() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const tsFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of tsFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Remove any standalone accessInfo that's not inside login
    content = content.replace(/(\s*},)\s*accessInfo: ['"`][^'"`]*['"`],?\n/g, '$1\n')
    
    // Fix double closing braces at the end
    content = content.replace(/\s*}\s*}\s*}\s*$/g, '\n  }\n}\n')
    
    // Ensure proper structure for admin section
    content = content.replace(/(admin: {\s*login: {[^}]+noPermission: ['"`][^'"`]*['"`])\s*}/g, '$1\n    }')
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ Fixed structure in ${file}`)
  }
}

fixAdminStructure().catch(console.error)
#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function cleanupSyntax() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const tsFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of tsFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Fix the admin.login section structure
    // First, remove the duplicate entries outside the login object
    content = content.replace(/(\s+noPermission: .*?,)\s*},\s*login\.noPermission: .*?,,/g, '$1\n    },')
    content = content.replace(/(\s+noPermission: .*?)\s*},\s*login\.noPermission: .*?,,/g, '$1\n    },')
    
    // Remove standalone login.* entries that are outside the login object
    content = content.replace(/\s+login\.\w+: ['"`][^'"`]*['"`],?,?\n/g, '\n')
    
    // Fix missing closing braces and commas
    content = content.replace(/},\s*,/g, '},')
    content = content.replace(/,\s*,/g, ',')
    content = content.replace(/,,/g, ',')
    
    // Fix the structure to ensure proper nesting
    content = content.replace(/(noPermission: ['"`][^'"`]*['"`]),?\s*},?\s*login\./g, '$1\n    },\n    ')
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ Fixed ${file}`)
  }
}

cleanupSyntax().catch(console.error)
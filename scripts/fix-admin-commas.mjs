#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function fixCommas() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const tsFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of tsFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Fix missing comma before admin section
    content = content.replace(/(\s+items: ['"][^'"]*['"])\n(\s+admin: {)/g, '$1\n  },\n  admin: {')
    
    // Fix missing closing brace for uiDocs
    content = content.replace(/(\s+items: ['"][^'"]*['"])\n(\s+})?\s*\n(\s+admin: {)/g, '$1\n  },\n  admin: {')
    
    await fs.writeFile(filePath, content, 'utf8')
    console.log(`✅ Fixed ${file}`)
  }
}

fixCommas().catch(console.error)
#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function fixClosingBraces() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const tsFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of tsFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Count opening and closing braces
    const openBraces = (content.match(/{/g) || []).length
    const closeBraces = (content.match(/}/g) || []).length
    
    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces
      console.log(`${file}: Missing ${diff} closing brace(s)`)
      
      // Add missing closing braces
      content = content.trimRight()
      for (let i = 0; i < diff; i++) {
        content += '\n}'
      }
      content += '\n'
      
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`✅ Fixed ${file}`)
    } else if (openBraces === closeBraces) {
      console.log(`✓ ${file} is balanced`)
    } else {
      console.log(`⚠️ ${file}: Too many closing braces`)
    }
  }
}

fixClosingBraces().catch(console.error)
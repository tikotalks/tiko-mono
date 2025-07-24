#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

async function fixAccessInfoPlacement() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const tsFiles = files.filter(file => file.endsWith('.ts'))
  
  for (const file of tsFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Remove any standalone accessInfo that's not inside login
    // This pattern matches accessInfo at the wrong indentation level
    const pattern = /(\s*},)\s*accessInfo: ['"`][^'"`]*['"`],?\s*\n\s*(dashboard: {)/g
    
    if (content.match(pattern)) {
      content = content.replace(pattern, '$1\n    $2')
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`✅ Fixed accessInfo placement in ${file}`)
    } else {
      console.log(`✓ ${file} is correct`)
    }
  }
}

fixAccessInfoPlacement().catch(console.error)
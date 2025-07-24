#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')

// Admin section structure to add
const adminSection = `  admin: {
    login: {
      title: 'TODO: Translate',
      subtitle: 'TODO: Translate',
      emailPlaceholder: 'TODO: Translate',
      passwordPlaceholder: 'TODO: Translate',
      accessInfo: 'TODO: Translate',
      noPermission: 'TODO: Translate'
    },
    dashboard: {
      title: 'TODO: Translate',
      totalImages: 'TODO: Translate',
      storageUsed: 'TODO: Translate',
      lastUpload: 'TODO: Translate',
      uploadImages: 'TODO: Translate',
      uploadDescription: 'TODO: Translate',
      viewLibrary: 'TODO: Translate',
      libraryDescription: 'TODO: Translate'
    },
    upload: {
      title: 'TODO: Translate',
      dropZone: 'TODO: Translate',
      selectFiles: 'TODO: Translate',
      uploading: 'TODO: Translate',
      processing: 'TODO: Translate',
      complete: 'TODO: Translate',
      dragDrop: 'TODO: Translate',
      or: 'TODO: Translate',
      uploadQueue: 'TODO: Translate',
      startUpload: 'TODO: Translate',
      clearQueue: 'TODO: Translate',
      onlyImages: 'TODO: Translate',
      uploadSuccess: 'TODO: Translate',
      uploadError: 'TODO: Translate'
    },
    library: {
      title: 'TODO: Translate',
      search: 'TODO: Translate',
      filter: 'TODO: Translate',
      category: 'TODO: Translate',
      tags: 'TODO: Translate',
      noImages: 'TODO: Translate'
    }
  }`

async function addAdminSection() {
  const files = await fs.readdir(BASE_LOCALES_DIR)
  const languageFiles = files.filter(file => file.endsWith('.ts') && file !== 'en.ts')
  
  for (const file of languageFiles) {
    const filePath = path.join(BASE_LOCALES_DIR, file)
    let content = await fs.readFile(filePath, 'utf8')
    
    // Check if admin section already exists
    if (content.includes('admin: {')) {
      console.log(`✅ ${file} already has admin section`)
      continue
    }
    
    // Find the closing brace of the main export
    const lastBraceIndex = content.lastIndexOf('}')
    const secondLastBraceIndex = content.lastIndexOf('}', lastBraceIndex - 1)
    
    // Insert admin section before the last closing brace
    const before = content.slice(0, secondLastBraceIndex)
    const after = content.slice(secondLastBraceIndex)
    
    // Check if we need a comma
    const needsComma = before.trim().endsWith('}')
    const insertion = needsComma ? ',\n' + adminSection : adminSection
    
    const newContent = before + insertion + after
    
    await fs.writeFile(filePath, newContent, 'utf8')
    console.log(`✅ Added admin section to ${file}`)
  }
}

addAdminSection().catch(console.error)
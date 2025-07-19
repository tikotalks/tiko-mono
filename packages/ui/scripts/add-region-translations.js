#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const REGION_TRANSLATIONS = {
  bg: 'Регион',
  cs: 'Oblast',
  cy: 'Rhanbarth',
  da: 'Region',
  el: 'Περιοχή',
  es: 'Región',
  et: 'Piirkond',
  fi: 'Alue',
  fr: 'Région',
  ga: 'Réigiún',
  hr: 'Regija',
  hu: 'Régió',
  hy: 'Շրջան',
  is: 'Svæði',
  it: 'Regione',
  lt: 'Regionas',
  lv: 'Reģions',
  mt: 'Reġjun',
  no: 'Region',
  pl: 'Region',
  pt: 'Região',
  ro: 'Regiune',
  ru: 'Регион',
  sk: 'Región',
  sl: 'Regija',
  sv: 'Region'
}

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'base')

function addRegionTranslation(langCode, filePath) {
  if (!REGION_TRANSLATIONS[langCode]) {
    return
  }

  let content = fs.readFileSync(filePath, 'utf8')
  
  // Check if region translation already exists
  if (content.includes("region: '")) {
    console.log(`${langCode}: region translation already exists`)
    return
  }
  
  // Find and replace the language line
  const languagePattern = new RegExp(`(\\s+language: '[^']+',)\\n(\\s+voiceAndSound:)`)
  const replacement = `$1\n    region: '${REGION_TRANSLATIONS[langCode]}',\n$2`
  
  if (languagePattern.test(content)) {
    content = content.replace(languagePattern, replacement)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`${langCode}: Added region translation`)
  } else {
    console.log(`${langCode}: Could not find insertion point`)
  }
}

// Process all language files
Object.keys(REGION_TRANSLATIONS).forEach(langCode => {
  const filePath = path.join(LOCALES_DIR, `${langCode}.ts`)
  if (fs.existsSync(filePath)) {
    addRegionTranslation(langCode, filePath)
  }
})

console.log('Region translations addition complete!')
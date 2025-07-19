#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Map of base languages to their regional variants
const languageVariants = {
  bg: ['bg-BG'], // Bulgarian - Bulgaria
  cs: ['cs-CZ'], // Czech - Czech Republic
  da: ['da-DK'], // Danish - Denmark
  et: ['et-EE'], // Estonian - Estonia
  fi: ['fi-FI'], // Finnish - Finland
  ga: ['ga-IE'], // Irish - Ireland
  hr: ['hr-HR'], // Croatian - Croatia
  hu: ['hu-HU'], // Hungarian - Hungary
  lt: ['lt-LT'], // Lithuanian - Lithuania
  lv: ['lv-LV'], // Latvian - Latvia
  no: ['no-NO'], // Norwegian - Norway
  ro: ['ro-RO'], // Romanian - Romania
  sk: ['sk-SK'], // Slovak - Slovakia
  sl: ['sl-SI'], // Slovenian - Slovenia
}

const localesPath = path.join(__dirname, '../packages/ui/src/i18n/locales')

// Create regional variant files
Object.entries(languageVariants).forEach(([baseCode, variants]) => {
  variants.forEach(variant => {
    const fileName = `${variant}.ts`
    const filePath = path.join(localesPath, fileName)
    
    if (fs.existsSync(filePath)) {
      console.log(`⚠️  ${fileName} already exists, skipping...`)
      return
    }
    
    const variantCode = variant.replace('-', '')
    const content = `import type { TranslationSchema } from '../types'
import { extendLocale } from '../utils'
import { ${baseCode} } from './base/${baseCode}'

export const ${variantCode}: TranslationSchema = extendLocale(${baseCode})
`
    
    fs.writeFileSync(filePath, content)
    console.log(`✅ Created ${fileName}`)
  })
})

console.log('\nDone! All regional variant files created.')
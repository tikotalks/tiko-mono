#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Languages to add with their native names
const newLanguages = [
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ga', name: 'Irish' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'no', name: 'Norwegian' }
]

const basePath = path.join(__dirname, '../packages/ui/src/i18n/locales/base')
const enPath = path.join(basePath, 'en.ts')

// Read English file as template
const enContent = fs.readFileSync(enPath, 'utf8')

// Process each new language
newLanguages.forEach(({ code, name }) => {
  const targetPath = path.join(basePath, `${code}.ts`)
  
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  ${name} (${code}.ts) already exists, skipping...`)
    return
  }
  
  // Replace the export name and add a comment
  const newContent = enContent
    .replace(/export const en:/, `export const ${code}:`)
    .replace(
      /import type { TranslationSchema } from '..\/..\/types'/,
      `import type { TranslationSchema } from '../../types'\n\n// ${name} translations - TO BE COMPLETED\n// For now, using English as placeholder to ensure type safety`
    )
  
  fs.writeFileSync(targetPath, newContent)
  console.log(`✅ Created ${name} (${code}.ts)`)
})

console.log('\nDone! All language files created.')
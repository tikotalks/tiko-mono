#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables from .env file
dotenv.config()

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')
const KEYS_FILE = path.join(__dirname, '../packages/ui/src/i18n/keys.ts')
const TYPES_FILE = path.join(__dirname, '../packages/ui/src/i18n/types.ts')

/**
 * Helper function to prompt user for input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim())
    })
  })
}

/**
 * Get all available language codes from the base locales directory
 */
async function getAvailableLanguages() {
  try {
    const files = await fs.readdir(BASE_LOCALES_DIR)
    const languages = files
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''))
      .sort()
    
    console.log(`📁 Found ${languages.length} languages:`, languages.join(', '))
    return languages
  } catch (error) {
    console.error('❌ Error reading base locales directory:', error.message)
    process.exit(1)
  }
}

/**
 * Call ChatGPT API to translate the value into all languages
 */
async function translateValue(value, languages) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPEN_AI_KEY
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY or VITE_OPEN_AI_KEY environment variable is required')
    console.log('💡 Set it with: export OPENAI_API_KEY=your_api_key')
    console.log('💡 Or: export VITE_OPEN_AI_KEY=your_api_key')
    process.exit(1)
  }

  const prompt = {
    prompt: "Translate the following value into all the languages listed in the 'languages' array.",
    instructions: "Strictly return a single valid JSON object in the format: { [language_code]: '[translated_value]' }. Do not include any other text or formatting.",
    languages,
    value
  }

  console.log('🤖 Requesting translations from ChatGPT...')
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Return only valid JSON with no additional text or formatting.'
          },
          {
            role: 'user',
            content: JSON.stringify(prompt)
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const translationText = data.choices[0].message.content.trim()
    
    console.log('📝 Raw response:', translationText)
    
    // Parse the JSON response
    let translations
    try {
      translations = JSON.parse(translationText)
    } catch (parseError) {
      console.error('❌ Failed to parse translation response as JSON:', parseError.message)
      console.log('Raw response:', translationText)
      process.exit(1)
    }

    // Validate that we have translations for all languages
    const missingLanguages = languages.filter(lang => !translations[lang])
    if (missingLanguages.length > 0) {
      console.error('❌ Missing translations for languages:', missingLanguages.join(', '))
      process.exit(1)
    }

    console.log('✅ Received translations for all languages')
    return translations
    
  } catch (error) {
    console.error('❌ Error calling ChatGPT API:', error.message)
    process.exit(1)
  }
}

/**
 * Check if a key exists in keys.ts, types.ts, and language files
 */
async function checkKeyExists(keyPath) {
  const { section, key } = parseKeyPath(keyPath)
  const exists = {
    inTypes: false,
    inKeys: false,
    inLanguages: {}
  }

  // Check in types.ts
  try {
    const typesContent = await fs.readFile(TYPES_FILE, 'utf8')
    const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`, 's')
    const match = typesContent.match(sectionRegex)
    if (match && match[1].includes(`${key}:`)) {
      exists.inTypes = true
    }
  } catch (error) {
    console.error('⚠️  Could not check types.ts:', error.message)
  }

  // Check in keys.ts
  try {
    const keysContent = await fs.readFile(KEYS_FILE, 'utf8')
    const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`, 's')
    const match = keysContent.match(sectionRegex)
    if (match && match[1].includes(`${key}:`)) {
      exists.inKeys = true
    }
  } catch (error) {
    console.error('⚠️  Could not check keys.ts:', error.message)
  }

  // Check in language files
  const languages = await getAvailableLanguages()
  for (const language of languages) {
    try {
      const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
      const content = await fs.readFile(filePath, 'utf8')
      const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`, 's')
      const match = content.match(sectionRegex)
      if (match && match[1].includes(`${key}:`)) {
        exists.inLanguages[language] = true
      } else {
        exists.inLanguages[language] = false
      }
    } catch (error) {
      console.error(`⚠️  Could not check ${language}.ts:`, error.message)
      exists.inLanguages[language] = false
    }
  }

  return exists
}

/**
 * Parse a key path like "common.showMore" into section and key
 */
function parseKeyPath(keyPath) {
  const parts = keyPath.split('.')
  if (parts.length < 2) {
    console.error('❌ Key must be in format "section.key" (e.g., "common.showMore")')
    process.exit(1)
  }
  
  const section = parts[0]
  const key = parts.slice(1).join('.')
  
  return { section, key }
}

/**
 * Add key to the TranslationSchema in types.ts file
 */
async function addKeyToTypesFile(keyPath) {
  const { section, key } = parseKeyPath(keyPath)
  
  try {
    let typesContent = await fs.readFile(TYPES_FILE, 'utf8')
    
    // Find the section in the TranslationSchema interface
    const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`, 's')
    const match = typesContent.match(sectionRegex)
    
    if (!match) {
      console.error(`❌ Section "${section}" not found in TranslationSchema in types.ts`)
      process.exit(1)
    }
    
    // Check if key already exists
    const keyExists = match[1].includes(`${key}:`)
    if (keyExists) {
      return false // Key already exists
    }
    
    // Add the key to the section
    const sectionContent = match[1]
    
    // Find the last property in the section to add the key after it
    const lines = sectionContent.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim())
    
    // Find the last property line (not the closing brace)
    let lastPropertyIndex = -1
    for (let i = nonEmptyLines.length - 1; i >= 0; i--) {
      const line = nonEmptyLines[i].trim()
      if (line && !line.startsWith('}') && !line.startsWith('//')) {
        lastPropertyIndex = i
        break
      }
    }
    
    if (lastPropertyIndex === -1) {
      // Empty section, just add the property
      const updatedSection = sectionContent.replace(/(\s*})$/, `\n    ${key}: string\n  }`)
      typesContent = typesContent.replace(sectionRegex, updatedSection)
    } else {
      // Add the new property after the last one
      const updatedSection = sectionContent.replace(/(\s*})$/, `\n    ${key}: string\n  }`)
      typesContent = typesContent.replace(sectionRegex, updatedSection)
    }
    
    await fs.writeFile(TYPES_FILE, typesContent, 'utf8')
    console.log(`✅ Added "${keyPath}" to TranslationSchema in types.ts`)
    return true
    
  } catch (error) {
    console.error('❌ Error updating types.ts:', error.message)
    process.exit(1)
  }
}

/**
 * Add key to the keys.ts file
 */
async function addKeyToKeysFile(keyPath) {
  const { section, key } = parseKeyPath(keyPath)
  
  try {
    let keysContent = await fs.readFile(KEYS_FILE, 'utf8')
    
    // Find the section in the keys file
    const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`,'s')
    const match = keysContent.match(sectionRegex)
    
    if (!match) {
      console.error(`❌ Section "${section}" not found in keys.ts`)
      process.exit(1)
    }
    
    // Check if key already exists
    const keyExists = match[1].includes(`${key}:`)
    if (keyExists) {
      return false // Key already exists
    }
    
    // Add the key to the section (before the closing brace)
    const sectionContent = match[1]
    const updatedSection = sectionContent.replace(/}$/, `    ${key}: ''\n  }`)
    
    keysContent = keysContent.replace(sectionRegex, updatedSection)
    
    await fs.writeFile(KEYS_FILE, keysContent, 'utf8')
    console.log(`✅ Added "${keyPath}" to keys.ts`)
    return true
    
  } catch (error) {
    console.error('❌ Error updating keys.ts:', error.message)
    process.exit(1)
  }
}

/**
 * Add translation to a specific language file
 * @param {string} language - Language code
 * @param {string} keyPath - Translation key path
 * @param {string} translation - Translation value
 * @param {boolean} forceUpdate - Force update existing translation
 */
async function addTranslationToLanguageFile(language, keyPath, translation, forceUpdate = false) {
  const { section, key } = parseKeyPath(keyPath)
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    
    // Find the section in the file
    const sectionRegex = new RegExp(`(${section}:\\s*{[^}]*})`, 's')
    const match = content.match(sectionRegex)
    
    if (!match) {
      console.error(`❌ Section "${section}" not found in ${language}.ts`)
      return false
    }
    
    // Check if key already exists
    const keyExists = match[1].includes(`${key}:`)
    if (keyExists && !forceUpdate) {
      console.log(`⚠️  Key "${keyPath}" already exists in ${language}.ts, skipping...`)
      return true
    }
    
    if (keyExists && forceUpdate) {
      // Update existing translation
      const keyRegex = new RegExp(`(${key}:\\s*['"\`])([^'"\`]*)(['"\`])`, 'g')
      const updatedSection = match[1].replace(keyRegex, `$1${translation}$3`)
      content = content.replace(sectionRegex, updatedSection)
      
      await fs.writeFile(filePath, content, 'utf8')
      console.log(`✅ Updated "${keyPath}" in ${language}.ts`)
      return true
    }
    
    // Add the translation to the section
    const sectionContent = match[1]
    
    // Find the last property in the section to add a comma after it
    const lines = sectionContent.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim())
    
    // Find the last property line (not the closing brace)
    let lastPropertyIndex = -1
    for (let i = nonEmptyLines.length - 1; i >= 0; i--) {
      const line = nonEmptyLines[i].trim()
      if (line && !line.startsWith('}') && !line.startsWith('//')) {
        lastPropertyIndex = i
        break
      }
    }
    
    if (lastPropertyIndex === -1) {
      // Empty section, just add the property
      const updatedSection = sectionContent.replace(/(\s*})$/, `\n    ${key}: '${translation}'\n  }`)
      content = content.replace(sectionRegex, updatedSection)
    } else {
      // Find the actual line in the original content
      let lineCount = 0
      let insertAfterIndex = -1
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim()) {
          if (lineCount === lastPropertyIndex) {
            insertAfterIndex = i
            break
          }
          lineCount++
        }
      }
      
      if (insertAfterIndex !== -1) {
        // Ensure the last property has a comma
        if (!lines[insertAfterIndex].trim().endsWith(',')) {
          lines[insertAfterIndex] = lines[insertAfterIndex].replace(/(\s*)$/, ',$1')
        }
        
        // Insert the new property after the last one
        lines.splice(insertAfterIndex + 1, 0, `    ${key}: '${translation}',`)
        
        const updatedSection = lines.join('\n')
        content = content.replace(sectionRegex, updatedSection)
      }
    }
    
    await fs.writeFile(filePath, content, 'utf8')
    return true
    
  } catch (error) {
    console.error(`❌ Error updating ${language}.ts:`, error.message)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: pnpm i18n add [key] [value]')
    console.log('Example: pnpm i18n add common.showMore "Show more"')
    process.exit(1)
  }
  
  const [keyPath, value] = args
  
  console.log(`🚀 Adding translation key: ${keyPath}`)
  console.log(`📝 Value: ${value}`)
  
  // Get all available languages
  const languages = await getAvailableLanguages()
  
  // Check if key exists anywhere
  console.log('\n🔍 Checking for existing keys...')
  const exists = await checkKeyExists(keyPath)
  
  let shouldUpdate = false
  let shouldContinue = true
  
  // Check if key exists and prompt user
  if (exists.inTypes || exists.inKeys || Object.values(exists.inLanguages).some(v => v)) {
    console.log('\n⚠️  Key already exists in:')
    if (exists.inTypes) console.log('  - TranslationSchema (types.ts)')
    if (exists.inKeys) console.log('  - Translation keys (keys.ts)')
    
    const languagesWithKey = Object.entries(exists.inLanguages)
      .filter(([_, hasKey]) => hasKey)
      .map(([lang]) => lang)
    
    if (languagesWithKey.length > 0) {
      console.log(`  - Language files: ${languagesWithKey.join(', ')}`)
    }
    
    const answer = await askQuestion('\nDo you want to update existing translations? (yes/no/cancel): ')
    
    if (answer === 'cancel' || answer === 'n' || answer === 'no') {
      console.log('❌ Operation cancelled')
      rl.close()
      process.exit(0)
    }
    
    shouldUpdate = answer === 'yes' || answer === 'y'
  }
  
  // Get translations from ChatGPT
  const translations = await translateValue(value, languages)
  
  // Add key to types.ts file (TranslationSchema) if not exists
  if (!exists.inTypes) {
    await addKeyToTypesFile(keyPath)
  } else if (shouldUpdate) {
    console.log(`ℹ️  Key already exists in TranslationSchema, skipping...`)
  }
  
  // Add key to keys.ts file if not exists
  if (!exists.inKeys) {
    await addKeyToKeysFile(keyPath)
  } else if (shouldUpdate) {
    console.log(`ℹ️  Key already exists in keys.ts, skipping...`)
  }
  
  // Add translations to all language files
  let successCount = 0
  for (const language of languages) {
    const translation = translations[language]
    const keyExists = exists.inLanguages[language]
    
    if (keyExists && !shouldUpdate) {
      console.log(`⏭️  Skipping ${language}.ts (key exists)`)
      continue
    }
    
    console.log(`📝 ${keyExists ? 'Updating' : 'Adding to'} ${language}.ts: "${translation}"`)
    
    const success = await addTranslationToLanguageFile(language, keyPath, translation, shouldUpdate)
    if (success) {
      successCount++
    }
  }
  
  console.log(`\n✅ Successfully added translations to ${successCount}/${languages.length} language files`)
  
  if (successCount === languages.length) {
    console.log('🎉 All translations added successfully!')
    console.log('💡 Run "pnpm -w run check:i18n" to validate the translations')
  } else {
    console.log('⚠️  Some translations failed to add. Please check the errors above.')
    rl.close()
    process.exit(1)
  }
  
  rl.close()
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message)
  rl.close()
  process.exit(1)
})
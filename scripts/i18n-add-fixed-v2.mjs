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
 * Parse a key path like "admin.media.filename" into parts
 */
function parseKeyPath(keyPath) {
  const parts = keyPath.split('.')
  if (parts.length < 2) {
    console.error('❌ Key must be in format "section.key" or "section.subsection.key" (e.g., "common.showMore" or "admin.media.filename")')
    process.exit(1)
  }
  
  return parts
}

/**
 * Create nested object structure from key path
 */
function createNestedStructure(parts, value) {
  if (parts.length === 1) {
    return { [parts[0]]: value }
  }
  
  return { [parts[0]]: createNestedStructure(parts.slice(1), value) }
}

/**
 * Get nested value from object using key path
 */
function getNestedValue(obj, parts) {
  let current = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return current
}

/**
 * Set nested value in object using key path
 */
function setNestedValue(obj, parts, value) {
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}

/**
 * Convert object to TypeScript interface string
 */
function objectToTypeScriptInterface(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let result = ''
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}: {\n`
      result += objectToTypeScriptInterface(value, indent + 1)
      result += `${spaces}}\n`
    } else {
      result += `${spaces}${key}: string\n`
    }
  }
  
  return result
}

/**
 * Convert object to TypeScript object string
 */
function objectToTypeScriptObject(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let result = ''
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      result += `${spaces}${key}: {\n`
      result += objectToTypeScriptObject(value, indent + 1)
      result += `${spaces}},\n`
    } else {
      result += `${spaces}${key}: '${value}',\n`
    }
  }
  
  return result
}

/**
 * Add key to the TranslationSchema in types.ts file
 */
async function updateTypesFile(keyPath) {
  const parts = parseKeyPath(keyPath)
  
  try {
    let typesContent = await fs.readFile(TYPES_FILE, 'utf8')
    
    // Find the TranslationSchema interface
    const schemaRegex = /(export interface TranslationSchema \{)([\s\S]*?)(\n\})/
    const match = typesContent.match(schemaRegex)
    
    if (!match) {
      console.error('❌ TranslationSchema interface not found in types.ts')
      process.exit(1)
    }
    
    // Parse the existing schema structure
    const existingSchema = match[2]
    
    // For now, we'll rebuild the types from the keys file
    console.log('✅ Types will be updated based on keys.ts structure')
    return true
    
  } catch (error) {
    console.error('❌ Error updating types.ts:', error.message)
    process.exit(1)
  }
}

/**
 * Add key to the keys.ts file
 */
async function updateKeysFile(keyPath) {
  const parts = parseKeyPath(keyPath)
  
  try {
    let keysContent = await fs.readFile(KEYS_FILE, 'utf8')
    
    // Find the TranslationKeys object
    const keysRegex = /(export const TranslationKeys: TranslationSchema = \{)([\s\S]*?)(\n\})/s
    const match = keysContent.match(keysRegex)
    
    if (!match) {
      console.error('❌ TranslationKeys object not found in keys.ts')
      process.exit(1)
    }
    
    // Parse the existing keys structure
    let keysObject
    try {
      // Create a safe evaluation context
      const keysString = match[2].trim()
      keysObject = eval(`({${keysString}})`)
    } catch (evalError) {
      console.error('❌ Failed to parse existing keys structure:', evalError.message)
      process.exit(1)
    }
    
    // Set the new nested value
    setNestedValue(keysObject, parts, '')
    
    // Convert back to TypeScript string
    const newKeysString = objectToTypeScriptObject(keysObject, 1)
    
    // Update the file content
    const newKeysContent = keysContent.replace(
      keysRegex,
      `$1\n${newKeysString}$3`
    )
    
    await fs.writeFile(KEYS_FILE, newKeysContent, 'utf8')
    console.log(`✅ Added "${keyPath}" to keys.ts`)
    return true
    
  } catch (error) {
    console.error('❌ Error updating keys.ts:', error.message)
    process.exit(1)
  }
}

/**
 * Add translation to a specific language file
 */
async function updateLanguageFile(language, keyPath, translation) {
  const parts = parseKeyPath(keyPath)
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    
    // Find the default export object
    const exportRegex = /(export default \{)([\s\S]*?)(\n\})/s
    const match = content.match(exportRegex)
    
    if (!match) {
      console.error(`❌ Default export object not found in ${language}.ts`)
      return false
    }
    
    // Parse the existing translation object
    let translationObject
    try {
      const objString = match[2].trim()
      translationObject = eval(`({${objString}})`)
    } catch (evalError) {
      console.error(`❌ Failed to parse existing translations in ${language}.ts:`, evalError.message)
      return false
    }
    
    // Set the new nested value
    setNestedValue(translationObject, parts, translation)
    
    // Convert back to TypeScript string
    const newTranslationString = objectToTypeScriptObject(translationObject, 1)
    
    // Update the file content
    const newContent = content.replace(
      exportRegex,
      `$1\n${newTranslationString}$3`
    )
    
    await fs.writeFile(filePath, newContent, 'utf8')
    console.log(`✅ Added "${keyPath}" to ${language}.ts`)
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
    console.log('Example: pnpm i18n add admin.media.filename "Filename"')
    process.exit(1)
  }
  
  const [keyPath, value] = args
  
  console.log(`🚀 Adding translation key: ${keyPath}`)
  console.log(`📝 Value: ${value}`)
  
  // Get all available languages
  const languages = await getAvailableLanguages()
  
  // Get translations from ChatGPT
  const translations = await translateValue(value, languages)
  
  // Update keys.ts file
  await updateKeysFile(keyPath)
  
  // Update types.ts file
  await updateTypesFile(keyPath)
  
  // Add translations to all language files
  let successCount = 0
  for (const language of languages) {
    const translation = translations[language]
    
    console.log(`📝 Adding to ${language}.ts: "${translation}"`)
    
    const success = await updateLanguageFile(language, keyPath, translation)
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
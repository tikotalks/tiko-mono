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
 * Parse a key path like "admin.login.title" into nested structure
 */
function parseKeyPath(keyPath) {
  const parts = keyPath.split('.')
  if (parts.length < 2) {
    console.error('❌ Key must be in format "section.key" or "section.subsection.key"')
    process.exit(1)
  }
  
  return {
    parts,
    fullPath: keyPath
  }
}

/**
 * Find a nested object in the content and add a key to it
 */
function addKeyToNestedObject(content, keyPath, value, isType = false) {
  const { parts } = parseKeyPath(keyPath)
  
  // Build regex to find the nested structure
  let regexPattern = ''
  let indent = 2
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (i === 0) {
      regexPattern = `(${part}:\\s*{[^}]*)`
    } else {
      regexPattern += `(${part}:\\s*{[^}]*)`
    }
    indent += 2
  }
  
  // For nested objects, we need to find the specific nested section
  if (parts.length > 2) {
    // For admin.login.title, we need to find login: { ... } inside admin: { ... }
    const topSection = parts[0]
    const subSection = parts[1]
    const key = parts[parts.length - 1]
    
    // Find the top section first
    const topSectionRegex = new RegExp(`(${topSection}:\\s*{)([\\s\\S]*?)(\\n\\s*})`, 'g')
    const topMatch = content.match(topSectionRegex)
    
    if (!topMatch) {
      console.error(`❌ Section "${topSection}" not found`)
      return null
    }
    
    // Now find the subsection within it
    const subSectionRegex = new RegExp(`(${subSection}:\\s*{)([\\s\\S]*?)(\\n\\s*})`)
    
    content = content.replace(topSectionRegex, (match, opening, innerContent, closing) => {
      const subMatch = innerContent.match(subSectionRegex)
      
      if (!subMatch) {
        console.error(`❌ Subsection "${subSection}" not found in "${topSection}"`)
        return match
      }
      
      // Add the key to the subsection
      const updatedInnerContent = innerContent.replace(subSectionRegex, (subMatch, subOpening, subContent, subClosing) => {
        // Check if key already exists
        if (subContent.includes(`${key}:`)) {
          return subMatch
        }
        
        // Find the last property to add comma if needed
        const lines = subContent.split('\n').filter(line => line.trim())
        const lastPropLine = lines[lines.length - 1]
        
        let newKeyLine = `\n      ${key}: ${isType ? 'string' : `'${value}'`}`
        
        // Add comma to previous line if needed
        if (lastPropLine && !lastPropLine.trim().endsWith(',')) {
          subContent = subContent.replace(lastPropLine, lastPropLine + ',')
        }
        
        return subOpening + subContent + newKeyLine + subClosing
      })
      
      return opening + updatedInnerContent + closing
    })
    
    return content
  } else {
    // Simple case: section.key
    const section = parts[0]
    const key = parts[1]
    
    const sectionRegex = new RegExp(`(${section}:\\s*{)([\\s\\S]*?)(\\n\\s*})`)
    
    return content.replace(sectionRegex, (match, opening, innerContent, closing) => {
      // Check if key already exists
      if (innerContent.includes(`${key}:`)) {
        return match
      }
      
      // Find the last property to add comma if needed
      const lines = innerContent.split('\n').filter(line => line.trim())
      const lastPropLine = lines[lines.length - 1]
      
      let newKeyLine = `\n    ${key}: ${isType ? 'string' : `'${value}'`}`
      
      // Add comma to previous line if needed
      if (lastPropLine && !lastPropLine.trim().endsWith(',')) {
        innerContent = innerContent.replace(lastPropLine, lastPropLine + ',')
      }
      
      return opening + innerContent + newKeyLine + closing
    })
  }
}

/**
 * Add key to the TranslationSchema in types.ts file
 */
async function addKeyToTypesFile(keyPath) {
  try {
    let typesContent = await fs.readFile(TYPES_FILE, 'utf8')
    const updatedContent = addKeyToNestedObject(typesContent, keyPath, '', true)
    
    if (!updatedContent) {
      console.error(`❌ Failed to add key to types.ts`)
      process.exit(1)
    }
    
    await fs.writeFile(TYPES_FILE, updatedContent, 'utf8')
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
  try {
    let keysContent = await fs.readFile(KEYS_FILE, 'utf8')
    const updatedContent = addKeyToNestedObject(keysContent, keyPath, '', false)
    
    if (!updatedContent) {
      console.error(`❌ Failed to add key to keys.ts`)
      process.exit(1)
    }
    
    await fs.writeFile(KEYS_FILE, updatedContent, 'utf8')
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
async function addTranslationToLanguageFile(language, keyPath, translation, forceUpdate = false) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    const updatedContent = addKeyToNestedObject(content, keyPath, translation, false)
    
    if (!updatedContent) {
      console.error(`❌ Failed to add translation to ${language}.ts`)
      return false
    }
    
    await fs.writeFile(filePath, updatedContent, 'utf8')
    console.log(`✅ Added "${keyPath}" to ${language}.ts`)
    return true
    
  } catch (error) {
    console.error(`❌ Error updating ${language}.ts:`, error.message)
    return false
  }
}

/**
 * Check if a key exists in keys.ts, types.ts, and language files
 */
async function checkKeyExists(keyPath) {
  const exists = {
    inTypes: false,
    inKeys: false,
    inLanguages: {}
  }

  // For now, return false for all to skip the check
  // The improved regex handling will prevent duplicates
  return exists
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: pnpm i18n:add [key] [value]')
    console.log('Example: pnpm i18n:add common.showMore "Show more"')
    console.log('Example: pnpm i18n:add admin.login.title "Admin Login"')
    process.exit(1)
  }
  
  const [keyPath, value] = args
  
  console.log(`🚀 Adding translation key: ${keyPath}`)
  console.log(`📝 Value: ${value}`)
  
  // Get all available languages
  const languages = await getAvailableLanguages()
  
  // Get translations from ChatGPT
  const translations = await translateValue(value, languages)
  
  // Add key to types.ts file
  await addKeyToTypesFile(keyPath)
  
  // Add key to keys.ts file
  await addKeyToKeysFile(keyPath)
  
  // Add translations to all language files
  let successCount = 0
  for (const language of languages) {
    const translation = translations[language]
    console.log(`📝 Adding to ${language}.ts: "${translation}"`)
    
    const success = await addTranslationToLanguageFile(language, keyPath, translation, false)
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
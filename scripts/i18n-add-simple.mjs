#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const BASE_LOCALES_DIR = path.join(__dirname, '../packages/ui/src/i18n/locales/base')
const KEYS_FILE = path.join(__dirname, '../packages/ui/src/i18n/keys.ts')
const TYPES_FILE = path.join(__dirname, '../packages/ui/src/i18n/types.ts')

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
    process.exit(1)
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
            content: `Translate "${value}" into these languages: ${languages.join(', ')}. Return JSON format: { "en-GB": "translated text", "nl": "translated text", etc. }`
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
    
    // Parse the JSON response
    let translations
    try {
      translations = JSON.parse(translationText)
    } catch (parseError) {
      console.error('❌ Failed to parse translation response as JSON:', parseError.message)
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
  return keyPath.split('.')
}

/**
 * Find the insertion point for a nested key in a TypeScript object string
 */
function findInsertionPoint(content, keyPath) {
  const parts = parseKeyPath(keyPath)
  let currentLevel = 0
  let inString = false
  let stringChar = null
  let braceStack = []
  let currentPath = []
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]
    
    // Handle string literals
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true
      stringChar = char
      continue
    }
    
    if (inString && char === stringChar && content[i - 1] !== '\\') {
      inString = false
      stringChar = null
      continue
    }
    
    if (inString) continue
    
    // Track braces
    if (char === '{') {
      braceStack.push('{')
    } else if (char === '}') {
      braceStack.pop()
      if (currentPath.length > 0) {
        currentPath.pop()
      }
    }
    
    // Look for property definitions
    if (char === ':' && !inString) {
      // Find the property name before the colon
      let propStart = i - 1
      while (propStart >= 0 && /\s/.test(content[propStart])) {
        propStart--
      }
      
      let propEnd = propStart
      while (propStart >= 0 && /[a-zA-Z0-9_]/.test(content[propStart])) {
        propStart--
      }
      propStart++
      
      const propName = content.slice(propStart, propEnd + 1)
      
      if (nextChar === ' ' && content[i + 2] === '{') {
        // This is an object property
        currentPath.push(propName)
      }
    }
  }
  
  return -1 // Default fallback
}

/**
 * Add key to nested structure in file content
 */
function addKeyToContent(content, keyPath, value, isKeysFile = false) {
  const parts = parseKeyPath(keyPath)
  const valueString = isKeysFile ? "''" : `'${value}'`
  
  // For simple cases, just find the right section and add the key
  if (parts.length === 2) {
    const [section, key] = parts
    
    // Find the section
    const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*)(\\})`,'s')
    const match = content.match(sectionRegex)
    
    if (match) {
      // Check if key already exists
      if (match[1].includes(`${key}:`)) {
        console.log(`⚠️  Key "${key}" already exists in section "${section}"`)
        return content
      }
      
      // Add the key before the closing brace
      const beforeClosing = match[1]
      const updated = beforeClosing.replace(/(\s*)$/, `\n    ${key}: ${valueString},\n  `)
      return content.replace(sectionRegex, `${updated}$2`)
    }
  }
  
  // For nested keys like "admin.media.filename"
  if (parts.length === 3) {
    const [section, subsection, key] = parts
    
    // First check if subsection exists
    const subsectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*${subsection}:\\s*\\{[^}]*)(\\}[^}]*\\})`,'s')
    const subsectionMatch = content.match(subsectionRegex)
    
    if (subsectionMatch) {
      // Subsection exists, add key to it
      if (subsectionMatch[1].includes(`${key}:`)) {
        console.log(`⚠️  Key "${key}" already exists in "${section}.${subsection}"`)
        return content
      }
      
      const beforeClosing = subsectionMatch[1]
      const updated = beforeClosing.replace(/(\s*)$/, `\n      ${key}: ${valueString},\n    `)
      return content.replace(subsectionRegex, `${updated}$2`)
    } else {
      // Subsection doesn't exist, create it
      const sectionRegex = new RegExp(`(${section}:\\s*\\{[^}]*)(\\})`,'s')
      const sectionMatch = content.match(sectionRegex)
      
      if (sectionMatch) {
        const beforeClosing = sectionMatch[1]
        const updated = beforeClosing.replace(/(\s*)$/, `\n    ${subsection}: {\n      ${key}: ${valueString},\n    },\n  `)
        return content.replace(sectionRegex, `${updated}$2`)
      }
    }
  }
  
  console.error(`❌ Could not find appropriate location for key: ${keyPath}`)
  return content
}

/**
 * Update keys.ts file
 */
async function updateKeysFile(keyPath) {
  try {
    let content = await fs.readFile(KEYS_FILE, 'utf8')
    const updatedContent = addKeyToContent(content, keyPath, '', true)
    
    if (updatedContent !== content) {
      await fs.writeFile(KEYS_FILE, updatedContent, 'utf8')
      console.log(`✅ Added "${keyPath}" to keys.ts`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error updating keys.ts:', error.message)
    return false
  }
}

/**
 * Update language file
 */
async function updateLanguageFile(language, keyPath, translation) {
  const filePath = path.join(BASE_LOCALES_DIR, `${language}.ts`)
  
  try {
    let content = await fs.readFile(filePath, 'utf8')
    const updatedContent = addKeyToContent(content, keyPath, translation, false)
    
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent, 'utf8')
      console.log(`✅ Added "${keyPath}" to ${language}.ts`)
      return true
    }
    
    return false
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
    console.log('Usage: node i18n-add-simple.mjs [key] [value]')
    console.log('Example: node i18n-add-simple.mjs admin.media.filename "Filename"')
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
  
  // Add translations to all language files
  let successCount = 0
  for (const language of languages) {
    const translation = translations[language] || value // fallback to original value
    
    console.log(`📝 Adding to ${language}.ts: "${translation}"`)
    
    const success = await updateLanguageFile(language, keyPath, translation)
    if (success) {
      successCount++
    }
  }
  
  console.log(`\n✅ Successfully added translations to ${successCount}/${languages.length} language files`)
  console.log('💡 Run "pnpm check:i18n" to validate the translations')
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})
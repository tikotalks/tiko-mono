#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const I18N_DIR = path.join(__dirname, '../packages/ui/src/i18n')
const LOCALES_DIR = path.join(I18N_DIR, 'locales')
const KEYS_FILE = path.join(I18N_DIR, 'keys.ts')

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`)
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Extract all keys from a nested object with dot notation
function extractKeys(obj, prefix = '') {
  const keys = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  
  return keys.sort()
}

// Load and parse a locale file
function loadLocaleFile(filePath) {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Extract the export object using a simple regex approach
    // This assumes the structure: export const localeName: TranslationSchema = { ... }
    const match = content.match(/export\s+const\s+\w+:\s*TranslationSchema\s*=\s*({[\s\S]*})\s*$/)
    if (!match) {
      throw new Error('Could not parse locale file structure')
    }
    
    // Use eval to parse the object (in a controlled environment)
    // Note: This is generally unsafe, but acceptable for build scripts
    const objectCode = match[1]
    const parsed = eval(`(${objectCode})`)
    
    return parsed
  } catch (error) {
    throw new Error(`Failed to load ${filePath}: ${error.message}`)
  }
}

// Load the reference keys from keys.ts
function loadReferenceKeys() {
  try {
    const content = fs.readFileSync(KEYS_FILE, 'utf8')
    
    // Extract the object passed to createKeysObject
    const match = content.match(/createKeysObject<TranslationSchema>\(\s*({[\s\S]*?})\s*\)/)
    if (!match) {
      throw new Error('Could not parse keys.ts structure')
    }
    
    const objectCode = match[1]
    const parsed = eval(`(${objectCode})`)
    
    return extractKeys(parsed)
  } catch (error) {
    throw new Error(`Failed to load reference keys: ${error.message}`)
  }
}

// Get all locale files
function getLocaleFiles() {
  const files = fs.readdirSync(LOCALES_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => ({
      name: file.replace('.ts', ''),
      path: path.join(LOCALES_DIR, file)
    }))
  
  return files
}

// Check for missing keys in a locale
function findMissingKeys(localeKeys, referenceKeys) {
  return referenceKeys.filter(key => !localeKeys.includes(key))
}

// Check for extra keys in a locale (not in reference)
function findExtraKeys(localeKeys, referenceKeys) {
  return localeKeys.filter(key => !referenceKeys.includes(key))
}

// Check for duplicate keys in a locale
function findDuplicateKeys(localeKeys) {
  const seen = new Set()
  const duplicates = []
  
  for (const key of localeKeys) {
    if (seen.has(key)) {
      duplicates.push(key)
    } else {
      seen.add(key)
    }
  }
  
  return duplicates
}

// Check for empty values in a locale object
function findEmptyValues(obj, prefix = '') {
  const emptyKeys = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      emptyKeys.push(...findEmptyValues(value, fullKey))
    } else if (value === '' || value == null) {
      emptyKeys.push(fullKey)
    }
  }
  
  return emptyKeys
}

// Main validation function
function validateI18n() {
  logSection('I18n Validation Report')
  
  let hasErrors = false
  let hasWarnings = false
  
  try {
    // Load reference keys
    logInfo('Loading reference keys from keys.ts...')
    const referenceKeys = loadReferenceKeys()
    logSuccess(`Loaded ${referenceKeys.length} reference keys`)
    
    // Get all locale files
    const localeFiles = getLocaleFiles()
    logInfo(`Found ${localeFiles.length} locale files: ${localeFiles.map(f => f.name).join(', ')}`)
    
    // Validate each locale
    const results = []
    
    for (const locale of localeFiles) {
      logSection(`Validating ${locale.name}`)
      
      try {
        // Load locale data
        const localeData = loadLocaleFile(locale.path)
        const localeKeys = extractKeys(localeData)
        
        // Find issues
        const missing = findMissingKeys(localeKeys, referenceKeys)
        const extra = findExtraKeys(localeKeys, referenceKeys)
        const duplicates = findDuplicateKeys(localeKeys)
        const empty = findEmptyValues(localeData)
        
        const result = {
          locale: locale.name,
          totalKeys: localeKeys.length,
          missing,
          extra,
          duplicates,
          empty,
          hasErrors: missing.length > 0 || duplicates.length > 0,
          hasWarnings: extra.length > 0 || empty.length > 0
        }
        
        results.push(result)
        
        // Report results for this locale
        if (result.hasErrors || result.hasWarnings) {
          if (missing.length > 0) {
            logError(`Missing ${missing.length} keys:`)
            missing.forEach(key => log(`  - ${key}`, 'red'))
            hasErrors = true
          }
          
          if (duplicates.length > 0) {
            logError(`Found ${duplicates.length} duplicate keys:`)
            duplicates.forEach(key => log(`  - ${key}`, 'red'))
            hasErrors = true
          }
          
          if (extra.length > 0) {
            logWarning(`Found ${extra.length} extra keys (not in reference):`)
            extra.forEach(key => log(`  - ${key}`, 'yellow'))
            hasWarnings = true
          }
          
          if (empty.length > 0) {
            logWarning(`Found ${empty.length} empty values:`)
            empty.forEach(key => log(`  - ${key}`, 'yellow'))
            hasWarnings = true
          }
        } else {
          logSuccess(`✅ All ${localeKeys.length} keys are valid`)
        }
        
      } catch (error) {
        logError(`Failed to validate ${locale.name}: ${error.message}`)
        hasErrors = true
      }
    }
    
    // Summary
    logSection('Summary')
    
    const totalMissing = results.reduce((sum, r) => sum + r.missing.length, 0)
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates.length, 0)
    const totalExtra = results.reduce((sum, r) => sum + r.extra.length, 0)
    const totalEmpty = results.reduce((sum, r) => sum + r.empty.length, 0)
    
    log(`\nValidated ${results.length} locales with ${referenceKeys.length} reference keys`)
    
    if (totalMissing > 0) {
      logError(`Total missing keys: ${totalMissing}`)
    } else {
      logSuccess('No missing keys found')
    }
    
    if (totalDuplicates > 0) {
      logError(`Total duplicate keys: ${totalDuplicates}`)
    } else {
      logSuccess('No duplicate keys found')
    }
    
    if (totalExtra > 0) {
      logWarning(`Total extra keys: ${totalExtra}`)
    } else {
      logSuccess('No extra keys found')
    }
    
    if (totalEmpty > 0) {
      logWarning(`Total empty values: ${totalEmpty}`)
    } else {
      logSuccess('No empty values found')
    }
    
    // Completion status
    const perfectLocales = results.filter(r => !r.hasErrors && !r.hasWarnings)
    const problemLocales = results.filter(r => r.hasErrors || r.hasWarnings)
    
    if (perfectLocales.length > 0) {
      logSuccess(`\n✅ Perfect locales (${perfectLocales.length}): ${perfectLocales.map(r => r.locale).join(', ')}`)
    }
    
    if (problemLocales.length > 0) {
      const errorLocales = problemLocales.filter(r => r.hasErrors)
      const warningLocales = problemLocales.filter(r => r.hasWarnings && !r.hasErrors)
      
      if (errorLocales.length > 0) {
        logError(`❌ Locales with errors (${errorLocales.length}): ${errorLocales.map(r => r.locale).join(', ')}`)
      }
      
      if (warningLocales.length > 0) {
        logWarning(`⚠️  Locales with warnings (${warningLocales.length}): ${warningLocales.map(r => r.locale).join(', ')}`)
      }
    }
    
    // Exit code
    const exitCode = hasErrors ? 1 : 0
    
    if (exitCode === 0) {
      logSuccess('\n🎉 All i18n validations passed!')
    } else {
      logError('\n💥 I18n validation failed!')
    }
    
    // JSON output for CI
    if (process.argv.includes('--json')) {
      console.log('\n' + JSON.stringify({
        success: !hasErrors,
        summary: {
          totalLocales: results.length,
          totalReferenceKeys: referenceKeys.length,
          totalMissing,
          totalDuplicates,
          totalExtra,
          totalEmpty
        },
        results
      }, null, 2))
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`)
    if (process.argv.includes('--verbose')) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Help text
function showHelp() {
  console.log(`
${colors.bold}Tiko I18n Validation Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/check-i18n.js [options]
  pnpm run check:i18n [options]

${colors.cyan}Options:${colors.reset}
  --help      Show this help message
  --json      Output results in JSON format (useful for CI)
  --verbose   Show detailed error information

${colors.cyan}Examples:${colors.reset}
  node scripts/check-i18n.js                 # Basic validation
  node scripts/check-i18n.js --json          # JSON output for CI
  pnpm run check:i18n                        # Using npm script

${colors.cyan}Exit Codes:${colors.reset}
  0 - All validations passed (no missing keys, no duplicates)
  1 - Validation failed (missing keys or duplicates found)

${colors.cyan}What this script checks:${colors.reset}
  ✅ Missing keys (keys in reference but not in locale)
  ✅ Duplicate keys (same key appears multiple times)
  ⚠️  Extra keys (keys in locale but not in reference)
  ⚠️  Empty values (keys with empty string values)
`)
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Run validation
validateI18n()
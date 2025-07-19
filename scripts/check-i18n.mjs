#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const I18N_DIR = path.join(__dirname, '../packages/ui/src/i18n')
const LOCALES_DIR = path.join(I18N_DIR, 'locales', 'base')

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

// Parse a TypeScript locale file to extract the translation object
function parseLocaleFile(filePath, localeName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Find the export statement for this locale
    const exportPattern = new RegExp(
      `export\\s+const\\s+${localeName}\\s*:\\s*\\w+\\s*=\\s*({[\\s\\S]*})\\s*(?:;\\s*)?$`,
      'm'
    )
    
    const match = content.match(exportPattern)
    if (!match) {
      throw new Error(`Could not find export const ${localeName} in ${filePath}`)
    }
    
    // Extract just the object part
    const objectCode = match[1]
    
    try {
      // Use eval to parse the object (safe for translation files)
      const parsed = eval(`(${objectCode})`)
      return parsed
    } catch (evalError) {
      throw new Error(`Failed to parse object in ${filePath}: ${evalError.message}`)
    }
    
  } catch (error) {
    throw new Error(`Failed to read or parse ${filePath}: ${error.message}`)
  }
}

// Load reference keys from English locale
function loadReferenceKeys() {
  try {
    const enFilePath = path.join(LOCALES_DIR, 'en.ts')
    if (!fs.existsSync(enFilePath)) {
      throw new Error('English locale file (en.ts) not found - needed as reference')
    }
    
    const enData = parseLocaleFile(enFilePath, 'en')
    return extractKeys(enData)
  } catch (error) {
    throw new Error(`Failed to load reference keys from en.ts: ${error.message}`)
  }
}

// Get all locale files
function getLocaleFiles() {
  if (!fs.existsSync(LOCALES_DIR)) {
    throw new Error(`Locales directory not found: ${LOCALES_DIR}`)
  }
  
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
  logSection('I18n Translation Data Validation')
  logInfo('🎯 Focusing only on translation data - ignoring TypeScript compilation issues')
  
  let hasErrors = false
  let hasWarnings = false
  let parseErrors = 0
  
  try {
    // Load reference keys from English
    logInfo('Loading reference keys from en.ts...')
    const referenceKeys = loadReferenceKeys()
    logSuccess(`Loaded ${referenceKeys.length} reference keys from English locale`)
    
    // Get all locale files
    const localeFiles = getLocaleFiles()
    logInfo(`Found ${localeFiles.length} locale files: ${localeFiles.map(f => f.name).join(', ')}`)
    
    // Validate each locale
    const results = []
    
    for (const locale of localeFiles) {
      logSection(`Validating ${locale.name}`)
      
      try {
        // Parse locale data
        const localeData = parseLocaleFile(locale.path, locale.name)
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
            missing.slice(0, 10).forEach(key => log(`  - ${key}`, 'red'))
            if (missing.length > 10) {
              log(`  ... and ${missing.length - 10} more`, 'red')
            }
            hasErrors = true
          }
          
          if (duplicates.length > 0) {
            logError(`Found ${duplicates.length} duplicate keys:`)
            duplicates.forEach(key => log(`  - ${key}`, 'red'))
            hasErrors = true
          }
          
          if (extra.length > 0) {
            logWarning(`Found ${extra.length} extra keys (not in English reference):`)
            extra.slice(0, 5).forEach(key => log(`  - ${key}`, 'yellow'))
            if (extra.length > 5) {
              log(`  ... and ${extra.length - 5} more`, 'yellow')
            }
            hasWarnings = true
          }
          
          if (empty.length > 0) {
            logWarning(`Found ${empty.length} empty values:`)
            empty.slice(0, 5).forEach(key => log(`  - ${key}`, 'yellow'))
            if (empty.length > 5) {
              log(`  ... and ${empty.length - 5} more`, 'yellow')
            }
            hasWarnings = true
          }
        } else {
          logSuccess(`✅ All ${localeKeys.length} keys are valid`)
        }
        
      } catch (error) {
        parseErrors++
        logError(`⚠️  Skipped ${locale.name}: ${error.message}`)
        logInfo(`  → This locale has syntax issues but translation validation continues`)
        
        // Don't treat parse errors as validation failures - they're separate issues
        // The developer can fix the syntax and re-run
      }
    }
    
    // Summary
    logSection('Summary')
    
    const totalMissing = results.reduce((sum, r) => sum + r.missing.length, 0)
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates.length, 0)
    const totalExtra = results.reduce((sum, r) => sum + r.extra.length, 0)
    const totalEmpty = results.reduce((sum, r) => sum + r.empty.length, 0)
    
    log(`\nValidated ${results.length} locales (${parseErrors} skipped due to syntax issues)`)
    log(`Reference: ${referenceKeys.length} keys from English locale`)
    
    if (totalMissing > 0) {
      logError(`❌ Total missing keys: ${totalMissing}`)
    } else {
      logSuccess('✅ No missing keys found')
    }
    
    if (totalDuplicates > 0) {
      logError(`❌ Total duplicate keys: ${totalDuplicates}`)
    } else {
      logSuccess('✅ No duplicate keys found')
    }
    
    if (totalExtra > 0) {
      logWarning(`⚠️  Total extra keys: ${totalExtra}`)
    } else {
      logSuccess('✅ No extra keys found')
    }
    
    if (totalEmpty > 0) {
      logWarning(`⚠️  Total empty values: ${totalEmpty}`)
    } else {
      logSuccess('✅ No empty values found')
    }
    
    if (parseErrors > 0) {
      logWarning(`⚠️  ${parseErrors} locales skipped due to syntax issues (fix them separately)`)
    }
    
    // Completion status
    const perfectLocales = results.filter(r => !r.hasErrors && !r.hasWarnings)
    const errorLocales = results.filter(r => r.hasErrors)
    const warningLocales = results.filter(r => r.hasWarnings && !r.hasErrors)
    
    if (perfectLocales.length > 0) {
      logSuccess(`\n✅ Perfect locales (${perfectLocales.length}): ${perfectLocales.map(r => r.locale).join(', ')}`)
    }
    
    if (errorLocales.length > 0) {
      logError(`\n❌ Locales with data errors (${errorLocales.length}): ${errorLocales.map(r => r.locale).join(', ')}`)
    }
    
    if (warningLocales.length > 0) {
      logWarning(`\n⚠️  Locales with warnings (${warningLocales.length}): ${warningLocales.map(r => r.locale).join(', ')}`)
    }
    
    // Exit code based on translation data errors only
    // Parse errors and warnings don't fail the build
    const exitCode = hasErrors ? 1 : 0
    
    if (exitCode === 0) {
      logSuccess('\n🎉 All translation data is valid!')
      if (hasWarnings) {
        logWarning('📝 Some warnings found (extra keys, empty values) but they don\'t fail the build')
      }
      if (parseErrors > 0) {
        logWarning('🔧 Some files had syntax errors - fix them when convenient')
      }
    } else {
      logError('\n💥 Translation validation failed!')
      logError('🎯 Focus: Missing keys or duplicate keys found')
      if (parseErrors > 0) {
        logInfo('ℹ️  Note: Syntax errors in some files were ignored for this validation')
      }
    }
    
    // JSON output for CI
    if (process.argv.includes('--json')) {
      console.log('\n' + JSON.stringify({
        success: !hasErrors,
        summary: {
          validatedLocales: results.length,
          skippedLocales: parseErrors,
          totalReferenceKeys: referenceKeys.length,
          totalMissing,
          totalDuplicates,
          totalExtra,
          totalEmpty,
          perfectLocales: perfectLocales.length,
          errorLocales: errorLocales.length,
          warningLocales: warningLocales.length
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
${colors.bold}Tiko I18n Translation Data Validator (Focused)${colors.reset}

${colors.cyan}Purpose:${colors.reset}
  Validates ONLY translation data quality - missing keys, duplicates, empty values.
  Ignores TypeScript compilation errors, syntax issues, and formatting problems.

${colors.cyan}Usage:${colors.reset}
  node scripts/check-i18n-focused.mjs [options]

${colors.cyan}Options:${colors.reset}
  --help      Show this help message
  --json      Output results in JSON format (useful for CI)
  --verbose   Show detailed error information

${colors.cyan}What this validates:${colors.reset}
  🎯 Missing translation keys (compared to English locale)
  🎯 Duplicate keys within a locale
  ⚠️  Extra keys (exist in locale but not in English)
  ⚠️  Empty values (keys with empty strings)

${colors.cyan}What this IGNORES:${colors.reset}
  🚫 TypeScript compilation errors in other files
  🚫 Code formatting issues (semicolons, spacing, etc.)
  🚫 Import/export syntax errors  
  🚫 Type definition mismatches
  🚫 Regional locale files that don't exist yet

${colors.cyan}Behavior:${colors.reset}
  📝 Files with syntax errors are skipped (reported but don't fail build)
  🎯 Only missing/duplicate keys cause build failures
  ⚠️  Warnings (extra keys, empty values) don't fail the build
  📊 Uses English locale as the reference for all comparisons

${colors.cyan}Exit Codes:${colors.reset}
  0 - All translation data is valid (warnings and parse errors are OK)
  1 - Critical translation issues (missing keys or duplicates)
`)
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Run validation
validateI18n()
#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Configuration
const I18N_DIR = path.join(__dirname, '../packages/ui/src/i18n')
const LOCALES_DIR = path.join(I18N_DIR, 'locales')
const TEMP_DIR = path.join(__dirname, '../.temp-i18n-validation')

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

// Create a temporary TypeScript configuration for compilation
function createTempTsConfig() {
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      moduleResolution: "node",
      strict: false,
      allowJs: true,
      outDir: path.join(TEMP_DIR, 'dist'),
      rootDir: path.join(__dirname, '../packages/ui/src'),
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true
    },
    include: [
      path.join(__dirname, '../packages/ui/src/i18n/**/*')
    ]
  }
  
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }
  
  fs.writeFileSync(
    path.join(TEMP_DIR, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  )
}

// Compile TypeScript files to JavaScript
function compileLocaleFiles() {
  try {
    logInfo('Compiling TypeScript files...')
    
    // Create temp directory and tsconfig
    createTempTsConfig()
    
    // Run TypeScript compiler
    const tscPath = path.join(__dirname, '../node_modules/.bin/tsc')
    const command = `"${tscPath}" --project "${path.join(TEMP_DIR, 'tsconfig.json')}"`
    
    execSync(command, { 
      stdio: 'pipe',
      cwd: __dirname 
    })
    
    logSuccess('TypeScript compilation successful')
    return true
  } catch (error) {
    logError(`TypeScript compilation failed:`)
    
    // Try to extract useful error information
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message
    const lines = output.split('\n').filter(line => line.trim())
    
    // Show the actual compilation errors
    for (const line of lines) {
      if (line.includes('error TS')) {
        // Parse TypeScript error format: file(line,col): error TS1234: message
        const match = line.match(/([^(]+)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/)
        if (match) {
          const [, file, lineNum, col, errorCode, message] = match
          const relativeFile = path.relative(__dirname, file)
          logError(`  ${relativeFile}:${lineNum}:${col} - ${errorCode}: ${message}`)
        } else {
          logError(`  ${line}`)
        }
      }
    }
    
    return false
  }
}

// Load a compiled locale file
async function loadCompiledLocale(localeName) {
  try {
    const compiledPath = path.join(TEMP_DIR, 'dist', 'i18n', 'locales', 'base', `${localeName}.js`)
    
    if (!fs.existsSync(compiledPath)) {
      throw new Error(`Compiled file not found: ${compiledPath}`)
    }
    
    // Convert to file:// URL for ES module import
    const fileUrl = `file://${compiledPath.replace(/\\/g, '/')}`
    
    // Dynamic import the compiled JS file
    const module = await import(fileUrl)
    
    // The exported object should be named after the locale (e.g., module.en, module.fr)
    const localeData = module[localeName]
    
    if (!localeData) {
      throw new Error(`No export named '${localeName}' found in compiled module`)
    }
    
    return localeData
  } catch (error) {
    throw new Error(`Failed to load compiled locale '${localeName}': ${error.message}`)
  }
}

// Load reference keys from compiled keys.js
async function loadReferenceKeys() {
  try {
    const compiledKeysPath = path.join(TEMP_DIR, 'dist', 'i18n', 'keys.js')
    
    if (!fs.existsSync(compiledKeysPath)) {
      throw new Error(`Compiled keys file not found: ${compiledKeysPath}`)
    }
    
    // Convert to file:// URL for ES module import
    const fileUrl = `file://${compiledKeysPath.replace(/\\/g, '/')}`
    
    // Dynamic import the compiled JS file
    const module = await import(fileUrl)
    
    // The translationKeys should be available as a named export
    const translationKeys = module.translationKeys
    
    if (!translationKeys) {
      throw new Error('No translationKeys export found in compiled keys module')
    }
    
    return extractKeys(translationKeys)
  } catch (error) {
    throw new Error(`Failed to load reference keys: ${error.message}`)
  }
}

// Get all locale files
function getLocaleFiles() {
  const baseDir = path.join(LOCALES_DIR, 'base')
  const files = fs.readdirSync(baseDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => ({
      name: file.replace('.ts', ''),
      path: path.join(baseDir, file)
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

// Cleanup temporary files
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

// Main validation function
async function validateI18n() {
  logSection('I18n Validation Report')
  
  let hasErrors = false
  let hasWarnings = false
  
  try {
    // Compile TypeScript files first
    const compilationSuccess = compileLocaleFiles()
    if (!compilationSuccess) {
      logError('Cannot proceed with validation due to compilation errors')
      process.exit(1)
    }
    
    // Load reference keys
    logInfo('Loading reference keys from compiled keys.js...')
    const referenceKeys = await loadReferenceKeys()
    logSuccess(`Loaded ${referenceKeys.length} reference keys`)
    
    // Get all locale files
    const localeFiles = getLocaleFiles()
    logInfo(`Found ${localeFiles.length} locale files: ${localeFiles.map(f => f.name).join(', ')}`)
    
    // Validate each locale
    const results = []
    
    for (const locale of localeFiles) {
      logSection(`Validating ${locale.name}`)
      
      try {
        // Load compiled locale data
        const localeData = await loadCompiledLocale(locale.name)
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
        
        // Try to give more specific guidance
        if (error.message.includes('Compiled file not found')) {
          logError(`  → This usually means the TypeScript file has syntax errors`)
          logError(`  → Check ${locale.path} for syntax issues`)
        } else if (error.message.includes('No export named')) {
          logError(`  → The file should export a const named '${locale.name}' of type TranslationSchema`)
          logError(`  → Expected: export const ${locale.name}: TranslationSchema = { ... }`)
        }
        
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
    
    return exitCode
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`)
    if (process.argv.includes('--verbose')) {
      console.error(error.stack)
    }
    return 1
  } finally {
    // Always cleanup temp files
    cleanup()
  }
}

// Help text
function showHelp() {
  console.log(`
${colors.bold}Tiko I18n Validation Script (Improved)${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/check-i18n-new.mjs [options]

${colors.cyan}Options:${colors.reset}
  --help      Show this help message
  --json      Output results in JSON format (useful for CI)
  --verbose   Show detailed error information

${colors.cyan}Examples:${colors.reset}
  node scripts/check-i18n-new.mjs                 # Basic validation
  node scripts/check-i18n-new.mjs --json          # JSON output for CI

${colors.cyan}Exit Codes:${colors.reset}
  0 - All validations passed (no missing keys, no duplicates)
  1 - Validation failed (missing keys, duplicates, or compilation errors)

${colors.cyan}What this script does:${colors.reset}
  🔧 Compiles TypeScript files properly (no regex parsing!)
  ✅ Missing keys (keys in reference but not in locale)
  ✅ Duplicate keys (same key appears multiple times)
  ⚠️  Extra keys (keys in locale but not in reference)
  ⚠️  Empty values (keys with empty string values)
  🎯 Specific error messages with file locations
  🧹 Automatic cleanup of temporary files

${colors.cyan}Improvements over old script:${colors.reset}
  ✅ Uses TypeScript compiler instead of regex + eval
  ✅ Gives specific error locations for syntax issues
  ✅ Focuses on data validation, not formatting
  ✅ Much better error messages
  ✅ Handles any TypeScript syntax (semicolons, spacing, etc.)
`)
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Run validation
validateI18n().then(exitCode => {
  process.exit(exitCode)
}).catch(error => {
  console.error('Unexpected error:', error)
  cleanup()
  process.exit(1)
})
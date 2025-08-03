#!/usr/bin/env node

/**
 * Test script for the new I18n Worker System
 * 
 * This script demonstrates the complete workflow:
 * 1. Fetch translation data from worker
 * 2. Generate TypeScript files
 * 3. Verify the generated files work correctly
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing I18n Worker System\n')

// Step 1: Test worker API endpoints
console.log('📡 Step 1: Testing Worker API Endpoints')
console.log('----------------------------------------')

try {
  // Test development endpoint (if running locally)
  console.log('Testing local development endpoint...')
  try {
    const devResponse = await fetch('http://localhost:8787/all')
    if (devResponse.ok) {
      const devData = await devResponse.json()
      console.log(`✅ Local worker: ${devData.metadata.totalKeys} keys, ${devData.metadata.totalLanguages} languages`)
    }
  } catch (error) {
    console.log('⚠️  Local worker not running (this is okay)')
  }

  // Test production endpoint (if deployed)
  console.log('Testing production endpoint...')
  try {
    const prodResponse = await fetch('https://i18n-data.silvandiepen.workers.dev/all')
    if (prodResponse.ok) {
      const prodData = await prodResponse.json()
      console.log(`✅ Production worker: ${prodData.metadata.totalKeys} keys, ${prodData.metadata.totalLanguages} languages`)
    }
  } catch (error) {
    console.log('⚠️  Production worker not available:', error.message)
  }
  
  console.log()
} catch (error) {
  console.error('❌ Worker endpoint test failed:', error)
}

// Step 2: Test generation script
console.log('🏗️  Step 2: Testing Generation Script')
console.log('-----------------------------------')

try {
  console.log('Running generation script...')
  
  // Try with local worker first, fallback to production
  let generationCommand = 'node scripts/generate-i18n-from-worker.js'
  
  try {
    execSync(generationCommand, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    console.log('✅ Generation script completed successfully')
  } catch (error) {
    console.log('⚠️  Local generation failed, trying production...')
    try {
      execSync(generationCommand + ' --env=production', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      })
      console.log('✅ Production generation completed successfully')
    } catch (prodError) {
      console.error('❌ Both local and production generation failed')
      throw prodError
    }
  }
  
  console.log()
} catch (error) {
  console.error('❌ Generation script test failed:', error.message)
}

// Step 3: Verify generated files
console.log('🔍 Step 3: Verifying Generated Files')
console.log('-----------------------------------')

const generatedDir = path.join(__dirname, '../packages/ui/src/i18n/generated')

try {
  // Check if directory exists
  if (!fs.existsSync(generatedDir)) {
    throw new Error('Generated directory does not exist')
  }

  // Check required files
  const requiredFiles = ['index.ts', 'types.ts']
  const generatedFiles = fs.readdirSync(generatedDir)
  
  console.log('Generated files:')
  generatedFiles.forEach(file => {
    console.log(`  📄 ${file}`)
  })
  
  // Verify required files exist
  for (const file of requiredFiles) {
    if (!generatedFiles.includes(file)) {
      throw new Error(`Required file missing: ${file}`)
    }
  }
  
  // Check language files (should be .ts files other than types.ts and index.ts)
  const languageFiles = generatedFiles.filter(file => 
    file.endsWith('.ts') && !['types.ts', 'index.ts'].includes(file)
  )
  
  console.log(`✅ Found ${languageFiles.length} language files:`, languageFiles.map(f => f.replace('.ts', '')).join(', '))
  
  // Verify types.ts has content
  const typesContent = fs.readFileSync(path.join(generatedDir, 'types.ts'), 'utf8')
  if (!typesContent.includes('TranslationKey') || !typesContent.includes('Translations')) {
    throw new Error('types.ts does not contain expected type definitions')
  }
  console.log('✅ types.ts contains expected type definitions')
  
  // Verify index.ts has content
  const indexContent = fs.readFileSync(path.join(generatedDir, 'index.ts'), 'utf8')
  if (!indexContent.includes('AVAILABLE_LANGUAGES') || !indexContent.includes('translations')) {
    throw new Error('index.ts does not contain expected exports')
  }
  console.log('✅ index.ts contains expected exports')
  
  console.log()
} catch (error) {
  console.error('❌ File verification failed:', error.message)
}

// Step 4: Test TypeScript compilation
console.log('🔧 Step 4: Testing TypeScript Compilation')
console.log('----------------------------------------')

try {
  console.log('Testing TypeScript compilation of generated files...')
  
  // Try to compile the generated files
  const testCompileCommand = `npx tsc --noEmit --skipLibCheck ${path.join(generatedDir, 'index.ts')}`
  
  execSync(testCompileCommand, { 
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  })
  
  console.log('✅ TypeScript compilation successful')
  console.log()
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message)
}

// Step 5: Test import in Node.js (basic syntax check)
console.log('📦 Step 5: Testing Module Import')
console.log('-------------------------------')

try {
  console.log('Testing module import syntax...')
  
  // Create a temporary test file to verify imports work
  const testFile = path.join(__dirname, 'temp-import-test.mjs')
  const testCode = `
try {
  const translations = await import('../packages/ui/src/i18n/generated/index.ts');
  console.log('✅ Import successful - Available languages:', translations.AVAILABLE_LANGUAGES);
  console.log('✅ Import successful - Translation keys found:', Object.keys(translations.translations).length > 0);
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}
`
  
  fs.writeFileSync(testFile, testCode)
  
  try {
    execSync(`node ${testFile}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
  } finally {
    // Clean up temp file
    fs.unlinkSync(testFile)
  }
  
  console.log()
} catch (error) {
  console.error('❌ Module import test failed:', error.message)
}

// Summary
console.log('📊 Test Summary')
console.log('==============')
console.log('The I18n Worker System test is complete!')
console.log()
console.log('🎯 Next Steps:')
console.log('1. Deploy the i18n-data worker to Cloudflare')
console.log('2. Update your build processes to use the new generation script')
console.log('3. Update apps to use the static i18n system')
console.log('4. Test in your applications')
console.log()
console.log('📖 Usage Examples:')
console.log('  # Generate all translations from production')
console.log('  pnpm run generate:i18n:worker:prod')
console.log()
console.log('  # Generate app-specific translations')
console.log('  node scripts/generate-i18n-from-worker.js --app=timer --env=production')
console.log()
console.log('  # Use in Vue components')
console.log('  const { t } = useI18n()')
console.log('  const message = t("common.save")')
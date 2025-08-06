#!/usr/bin/env node

/**
 * Wrapper script to allow using `pnpm i18n:lang en` syntax
 * This calls the main i18n generation script with the language parameter
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the language from command line arguments
const lang = process.argv[2]

if (!lang) {
  console.error('❌ Please specify a language code')
  console.log('Usage: pnpm i18n:lang <language-code>')
  console.log('Examples:')
  console.log('  pnpm i18n:lang en')
  console.log('  pnpm i18n:lang nl')
  console.log('  pnpm i18n:lang fr')
  process.exit(1)
}

// Build the command
const scriptPath = path.join(__dirname, 'generate-i18n-from-worker.mjs')
const args = ['--env=production', `--lang=${lang}`]

console.log(`🚀 Generating i18n for language: ${lang}`)

// Run the main script with the language parameter
const child = spawn('node', [scriptPath, ...args], {
  stdio: 'inherit',
  shell: true
})

child.on('exit', (code) => {
  process.exit(code || 0)
})
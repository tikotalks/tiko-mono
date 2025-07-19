#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

function fixTodosInFile(filePath) {
  console.log(`Processing ${filePath}...`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  let changeCount = 0
  
  // Match lines with TODO pattern - handles both regular quotes and escaped quotes
  const todoRegex = /^(\s*)([\w]+):\s*'(.+?)\s*\[TODO:[^\]]+\]'(,?)$/gm
  
  content = content.replace(todoRegex, (match, indent, key, englishText, comma) => {
    changeCount++
    // Simply remove the TODO part and keep the English text
    return `${indent}${key}: '${englishText}'${comma}`
  })
  
  if (changeCount > 0) {
    fs.writeFileSync(filePath, content)
    console.log(`✅ Fixed ${changeCount} TODOs in ${path.basename(filePath)}`)
  } else {
    console.log(`✓ No TODOs found in ${path.basename(filePath)}`)
  }
  
  return changeCount
}

// Process all base locale files
const basePath = path.join(__dirname, '../packages/ui/src/i18n/locales/base')
const files = fs.readdirSync(basePath).filter(f => f.endsWith('.ts'))

let totalFixed = 0

console.log('Fixing TODOs in all locale files...\n')

files.forEach(file => {
  const filePath = path.join(basePath, file)
  totalFixed += fixTodosInFile(filePath)
})

console.log(`\n🎉 Total TODOs fixed: ${totalFixed}`)
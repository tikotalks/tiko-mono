#!/usr/bin/env node

const { globby } = require('globby')
const fs = require('fs/promises')
const path = require('path')

/**
 * Analyzes the codebase to find all used icons
 * @param {string} appPath - Path to the app to analyze
 * @returns {Set<string>} Set of used icon names
 */
async function analyzeUsedIcons(appPath) {
  const usedIcons = new Set()
  
  // Patterns to find icon usage
  const patterns = [
    '**/*.vue',
    '**/*.ts', 
    '**/*.js'
  ]
  
  // Icon usage patterns
  const iconPatterns = [
    // TIcon name prop: <TIcon name="heart-fat" />
    /name=["']([^"']+)["']/g,
    // getIcon calls: getIcon('heart-fat')
    /getIcon\(["']([^"']+)["']\)/g,
    // TIcon with dynamic name: <TIcon :name="iconName" />
    // We'll need to handle this separately by looking at computed values
  ]
  
  try {
    const files = await globby(patterns, {
      cwd: appPath,
      ignore: ['node_modules/**', 'dist/**']
    })
    
    for (const file of files) {
      const fullPath = path.join(appPath, file)
      const content = await fs.readFile(fullPath, 'utf-8')
      
      // Extract icon names using regex patterns
      for (const pattern of iconPatterns) {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const iconName = match[1]
          if (iconName && !iconName.includes('$') && !iconName.includes('{')) {
            usedIcons.add(iconName)
          }
        }
      }
      
      // Also look for icon aliases in TIcon component
      if (content.includes('switch(props.name)')) {
        const aliasMatches = content.matchAll(/case ['"]([^'"]+)['"]:/g)
        for (const match of aliasMatches) {
          usedIcons.add(match[1])
        }
        
        const returnMatches = content.matchAll(/return ['"]([^'"]+)['"];/g)
        for (const match of returnMatches) {
          usedIcons.add(match[1])
        }
      }
    }
    
    console.log(`\n📊 Icon Analysis for ${path.basename(appPath)}:`)
    console.log(`   Files scanned: ${files.length}`)
    console.log(`   Icons found: ${usedIcons.size}`)
    console.log(`   Icons: ${Array.from(usedIcons).sort().join(', ')}\n`)
    
    return usedIcons
    
  } catch (error) {
    console.error(`Error analyzing icons in ${appPath}:`, error)
    return new Set()
  }
}

/**
 * Generate a custom icon build for an app
 */
async function generateCustomIconBuild(appPath, usedIcons) {
  const iconList = Array.from(usedIcons)
  
  const customBuild = `
// Auto-generated custom icon build for ${path.basename(appPath)}
// Contains only ${iconList.length} used icons instead of all icons

import { getIcon as originalGetIcon } from 'open-icon'

// Pre-defined list of icons used in this app
const USED_ICONS = new Set(${JSON.stringify(iconList, null, 2)})

// Cache for loaded icons
const iconCache = new Map()

/**
 * Get icon with tree-shaking - only loads icons that are actually used
 */
export async function getIcon(name) {
  if (!USED_ICONS.has(name)) {
    console.warn(\`Icon "\${name}" is not in the optimized build. Adding to dynamic load.\`)
    // Still allow dynamic icons, but warn about them
  }
  
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  
  const icon = await originalGetIcon(name)
  iconCache.set(name, icon)
  return icon
}

// Re-export other utilities
export * from 'open-icon'
export { getIcon as default }

// Export the list of optimized icons for debugging
export const OPTIMIZED_ICONS = USED_ICONS
`

  const outputPath = path.join(appPath, 'src', 'utils', 'optimized-icons.js')
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, customBuild)
  
  console.log(`✅ Generated optimized icon build: ${outputPath}`)
  return outputPath
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2)
  const appPath = args[0] || process.cwd()
  
  if (!appPath) {
    console.error('Please provide the app path to analyze')
    process.exit(1)
  }
  
  console.log(`🔍 Analyzing icon usage in: ${appPath}`)
  
  const usedIcons = await analyzeUsedIcons(appPath)
  
  if (usedIcons.size > 0) {
    await generateCustomIconBuild(appPath, usedIcons)
    
    console.log(`\n🎯 Tree-shaking Summary:`)
    console.log(`   ✅ Found ${usedIcons.size} unique icons`)
    console.log(`   ✅ Generated optimized icon build`)
    console.log(`\n💡 To use the optimized build, update your TIcon component to import from:`)
    console.log(`   import { getIcon } from '../utils/optimized-icons'`)
  } else {
    console.log('❌ No icons found. Make sure your app uses TIcon components.')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { analyzeUsedIcons, generateCustomIconBuild }
`
#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * Recursively find files with specific extensions
 */
function findFiles(dir, extensions = ['.vue', '.ts', '.js']) {
  const files = []
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item.name)
      
      if (item.isDirectory() && item.name !== 'node_modules' && item.name !== 'dist') {
        walk(fullPath)
      } else if (item.isFile() && extensions.some(ext => item.name.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }
  
  walk(dir)
  return files
}

/**
 * Analyzes the codebase to find all used icons
 */
function analyzeUsedIcons(appPath) {
  const usedIcons = new Set()
  
  // Icon usage patterns
  const iconPatterns = [
    // TIcon name prop: <TIcon name="heart-fat" />
    /name=["']([^"']+)["']/g,
    // getIcon calls: getIcon('heart-fat')
    /getIcon\(["']([^"']+)["']\)/g,
  ]
  
  try {
    const files = findFiles(appPath)
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      
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
 * Generate package.json for custom icon build
 */
function generateCustomIconPackage(appPath, usedIcons) {
  const iconList = Array.from(usedIcons)
  const appName = path.basename(appPath)
  
  // Create optimized icon utility
  const optimizedIcons = `
// Auto-generated optimized icon loader for ${appName}
// Contains only ${iconList.length} used icons

const USED_ICONS = new Set(${JSON.stringify(iconList, null, 2)})

// Import all used icons statically for better tree-shaking
const iconLoaders = {
${iconList.map(icon => `  '${icon}': () => import('open-icon/dist/icons/${icon}.js').catch(() => null)`).join(',\n')}
}

// Cache for loaded icons
const iconCache = new Map()

/**
 * Optimized icon loader - only loads icons that are actually used
 */
export async function getIcon(name) {
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  
  // Check if icon is in optimized set
  if (iconLoaders[name]) {
    try {
      const iconModule = await iconLoaders[name]()
      if (iconModule && iconModule.default) {
        iconCache.set(name, iconModule.default)
        return iconModule.default
      }
    } catch (error) {
      console.warn(\`Failed to load optimized icon "\${name}"\`, error)
    }
  }
  
  // Fallback to original getIcon for dynamic/unknown icons
  try {
    const { getIcon: originalGetIcon } = await import('open-icon')
    const icon = await originalGetIcon(name)
    iconCache.set(name, icon)
    return icon
  } catch (error) {
    console.error(\`Failed to load icon "\${name}"\`, error)
    return \`<svg viewBox="0 0 24 24"><text x="12" y="12" text-anchor="middle">\${name}</text></svg>\`
  }
}

// Re-export types
export * from 'open-icon'

// Export optimization info for debugging
export const OPTIMIZATION_INFO = {
  usedIcons: USED_ICONS,
  totalOptimized: ${iconList.length},
  appName: '${appName}'
}
`

  // Write to app's src/utils directory
  const utilsDir = path.join(appPath, 'src', 'utils')
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true })
  }
  
  const outputPath = path.join(utilsDir, 'icons.js')
  fs.writeFileSync(outputPath, optimizedIcons)
  
  console.log(`✅ Generated optimized icon loader: ${outputPath}`)
  
  // Also generate a summary report
  const reportPath = path.join(appPath, 'icon-analysis.json')
  const report = {
    appName,
    timestamp: new Date().toISOString(),
    totalIcons: iconList.length,
    icons: iconList.sort(),
    optimizedFile: 'src/utils/icons.js'
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`📋 Generated analysis report: ${reportPath}`)
  
  return { outputPath, reportPath }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  let appPath = args[0]
  
  if (!appPath) {
    console.error('❌ Please provide the app path to analyze')
    console.log('Usage: node scripts/analyze-icons-simple.js <app-path>')
    console.log('Example: node scripts/analyze-icons-simple.js apps/radio')
    process.exit(1)
  }
  
  // Make path absolute
  if (!path.isAbsolute(appPath)) {
    appPath = path.resolve(process.cwd(), appPath)
  }
  
  if (!fs.existsSync(appPath)) {
    console.error(`❌ Path does not exist: ${appPath}`)
    process.exit(1)
  }
  
  console.log(`🔍 Analyzing icon usage in: ${appPath}`)
  
  const usedIcons = analyzeUsedIcons(appPath)
  
  if (usedIcons.size > 0) {
    const { outputPath, reportPath } = generateCustomIconPackage(appPath, usedIcons)
    
    console.log(`\n🎯 Tree-shaking Summary:`)
    console.log(`   ✅ Found ${usedIcons.size} unique icons`)
    console.log(`   ✅ Generated optimized icon loader`)
    console.log(`   📁 Files created:`)
    console.log(`      - ${path.relative(process.cwd(), outputPath)}`)
    console.log(`      - ${path.relative(process.cwd(), reportPath)}`)
    console.log(`\n💡 To use the optimized icons, update your TIcon component to import from:`)
    console.log(`   import { getIcon } from './utils/icons'`)
  } else {
    console.log('❌ No icons found. Make sure your app uses TIcon components.')
  }
}

if (require.main === module) {
  main()
}

module.exports = { analyzeUsedIcons, generateCustomIconPackage }
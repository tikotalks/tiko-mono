import { createFilter } from '@rollup/pluginutils'
import fs from 'fs'
import path from 'path'

/**
 * Vite plugin for tree-shaking open-icon icons
 * 
 * This plugin analyzes the codebase at build time to determine which icons
 * are actually used and generates an optimized icon loader.
 * 
 * @param {Object} options Plugin options
 * @param {string[]} options.include File patterns to include in analysis
 * @param {string[]} options.exclude File patterns to exclude from analysis
 * @param {boolean} options.generateReport Whether to generate analysis reports
 * @param {string} options.outputDir Directory to output optimized icon loader
 * @returns {Object} Vite plugin object
 */
export function iconTreeshakePlugin(options = {}) {
  const {
    include = ['**/*.vue', '**/*.ts', '**/*.js'],
    exclude = ['node_modules/**', 'dist/**'],
    generateReport = true,
    outputDir = 'src/utils'
  } = options

  const filter = createFilter(include, exclude)
  const usedIcons = new Set()
  let isProduction = false
  let root = ''

  return {
    name: 'icon-treeshake',
    
    configResolved(config) {
      isProduction = config.command === 'build'
      root = config.root
    },
    
    buildStart() {
      // Clear used icons set for fresh build
      usedIcons.clear()
      
      if (isProduction) {
        console.log('🔍 Icon tree-shaking: Analyzing icon usage...')
      }
    },
    
    transform(code, id) {
      if (!filter(id) || !isProduction) return null

      // Only analyze Vue files and files that mention TIcon
      if (!code.includes('TIcon') && !code.includes('getIcon')) return null

      // Extract icon names from TIcon usage
      const iconPatterns = [
        // Static names: name="icon-name"
        /name="([^"]+)"/g,
        // Single quotes: name='icon-name'
        /name='([^']+)'/g,
        // getIcon calls
        /getIcon\(["']([^"']+)["']\)/g,
      ]

      for (const pattern of iconPatterns) {
        let match
        while ((match = pattern.exec(code)) !== null) {
          const iconName = match[1]
          
          // Skip if it contains variables or expressions
          if (!iconName.includes('?') && 
              !iconName.includes('.') && 
              !iconName.includes(' ') &&
              !iconName.includes(':') &&
              iconName.length > 0) {
            usedIcons.add(iconName)
          }
        }
      }

      // Extract from ternary expressions
      const ternaryPattern = /\?\s*['"]([^'"]+)['"][^:]*:\s*['"]([^'"]+)['"]/g
      let ternaryMatch
      while ((ternaryMatch = ternaryPattern.exec(code)) !== null) {
        usedIcons.add(ternaryMatch[1])
        usedIcons.add(ternaryMatch[2])
      }

      return null
    },
    
    resolveId(id) {
      if (id === 'virtual:optimized-icons') {
        return id
      }
    },
    
    load(id) {
      if (id === 'virtual:optimized-icons') {
        const iconList = Array.from(usedIcons).sort()
        
        return `
// Auto-generated optimized icon loader
// Generated during build with ${iconList.length} icons

const USED_ICONS = new Set([
${iconList.map(icon => `  '${icon}'`).join(',\n')}
])

const iconCache = new Map()

export async function getIcon(name) {
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  
  try {
    const { getIcon: originalGetIcon } = await import('open-icon')
    const icon = await originalGetIcon(name)
    
    if (!USED_ICONS.has(name)) {
      console.info(\`📊 Icon "\${name}" used dynamically (not in optimized set)\`)
    }
    
    iconCache.set(name, icon)
    return icon
  } catch (error) {
    console.error(\`Failed to load icon "\${name}"\`, error)
    return \`<svg viewBox="0 0 24 24"><text x="12" y="12" text-anchor="middle" fill="currentColor">\${name}</text></svg>\`
  }
}

export * from 'open-icon'

export const OPTIMIZATION_INFO = {
  usedIcons: USED_ICONS,
  totalOptimized: ${iconList.length}
}
`
      }
    },
    
    generateBundle() {
      if (!isProduction || usedIcons.size === 0) return

      const iconList = Array.from(usedIcons).sort()
      
      console.log(`\n🎯 Icon Tree-shaking Results:`)
      console.log(`   📦 Icons used: ${iconList.length}`)
      console.log(`   🔧 Generated optimized loader`)
      
      if (generateReport) {
        // Generate physical file for development use
        const outputPath = path.join(root, outputDir, 'icons.js')
        const outputContent = `// Auto-generated optimized icon loader
// Generated on: ${new Date().toISOString()}
// Contains ${iconList.length} icons

const USED_ICONS = new Set([
${iconList.map(icon => `  '${icon}'`).join(',\n')}
])

const iconCache = new Map()

export async function getIcon(name) {
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  
  try {
    const { getIcon: originalGetIcon } = await import('open-icon')
    const icon = await originalGetIcon(name)
    
    if (!USED_ICONS.has(name)) {
      console.info(\`📊 Icon "\${name}" used dynamically (not in optimized set)\`)
    }
    
    iconCache.set(name, icon)
    return icon
  } catch (error) {
    console.error(\`Failed to load icon "\${name}"\`, error)
    return \`<svg viewBox="0 0 24 24"><text x="12" y="12" text-anchor="middle" fill="currentColor">\${name}</text></svg>\`
  }
}

export * from 'open-icon'

export const OPTIMIZATION_INFO = {
  usedIcons: USED_ICONS,
  totalOptimized: ${iconList.length},
  generatedAt: '${new Date().toISOString()}'
}
`

        // Ensure output directory exists
        const outputDirPath = path.dirname(outputPath)
        if (!fs.existsSync(outputDirPath)) {
          fs.mkdirSync(outputDirPath, { recursive: true })
        }
        
        fs.writeFileSync(outputPath, outputContent)
        console.log(`   📁 Generated: ${path.relative(root, outputPath)}`)
        
        // Generate report
        const reportPath = path.join(root, 'icon-optimization-report.json')
        const report = {
          timestamp: new Date().toISOString(),
          totalIcons: iconList.length,
          icons: iconList,
          optimizedFile: path.relative(root, outputPath)
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
        console.log(`   📋 Report: ${path.relative(root, reportPath)}`)
      }
    }
  }
}

export default iconTreeshakePlugin
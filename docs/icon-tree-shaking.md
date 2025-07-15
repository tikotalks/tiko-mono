# Icon Tree-Shaking for open-icon

This document explains how to implement tree-shaking for the `open-icon` package to reduce bundle sizes by only including icons that are actually used in each app.

## Current Problem

Currently, every app builds **ALL** available icons from `open-icon`, resulting in:

- ❌ **Hundreds of unused icon files** in the build output
- ❌ **Large bundle sizes** with unnecessary assets
- ❌ **Slower load times** due to unused files
- ❌ **Poor tree-shaking** - icons are loaded dynamically

Example build output shows hundreds of icon files:
```
dist/assets/icon01-6ADWVZQ6-DFlDzYMx.js                    0.10 kB
dist/assets/dice1-4UKOWF7L-DmOG4-oT.js                     0.22 kB
dist/assets/check-fat-IW7GKKWQ-BqB5nkk6.js                 0.23 kB
... (hundreds more icons)
```

## Solution: Icon Tree-Shaking

We provide **three approaches** to solve this problem:

### 1. 🔍 Manual Analysis Script (Recommended for Development)

Use the analysis script to understand which icons your app actually uses:

```bash
# Analyze a specific app
npm run analyze-icons apps/radio

# Analyze all apps
npm run analyze-icons:all
```

**Example output:**
```
📊 Icon Analysis for radio:
   Vue files scanned: 12
   Icons found: 18
   Icons: add-m, check-m, clock, headphones, music, pause, play, volume, volume-2, ...

✅ Generated optimized icon loader: apps/radio/src/utils/icons.js
📋 Generated optimization report: apps/radio/icon-optimization-report.json
```

### 2. 🔧 Vite Plugin (Recommended for Production)

Add the Vite plugin to automatically generate optimized icon loaders during build:

```javascript
// vite.config.js
import { iconTreeshakePlugin } from '@tiko/vite-plugin-icon-treeshake'

export default defineConfig({
  plugins: [
    // ... other plugins
    iconTreeshakePlugin({
      generateReport: true,
      outputDir: 'src/utils'
    })
  ]
})
```

### 3. 🎯 Custom TIcon Component

Update your TIcon component to use the optimized icon loader:

```vue
<!-- TIcon.vue -->
<script setup lang="ts">
import { getIcon } from '../utils/icons' // Use optimized loader
// ... rest of component
</script>
```

## Implementation Steps

### Step 1: Analyze Current Usage

```bash
# See which icons each app actually uses
npm run analyze-icons apps/radio
npm run analyze-icons apps/timer
npm run analyze-icons apps/cards
```

### Step 2: Generate Optimized Loaders

The analysis script automatically generates:

1. **Optimized icon loader** (`src/utils/icons.js`)
   - Only loads icons used in your app
   - Falls back gracefully for dynamic icons
   - Provides usage warnings for debugging

2. **Analysis report** (`icon-optimization-report.json`)
   - Lists all icons found
   - Shows potential savings
   - Tracks generation timestamp

### Step 3: Update Your Components

Replace the open-icon import in your TIcon component:

```diff
- import { getIcon } from 'open-icon'
+ import { getIcon } from '../utils/icons'
```

### Step 4: Test and Monitor

The optimized loader provides console warnings for icons used dynamically:

```javascript
// This will show a warning if the icon wasn't in the optimized set
📊 Icon "dynamic-icon-name" used dynamically (not in optimized set)
```

## Bundle Size Impact

### Before Tree-Shaking
- **Radio app**: ~800+ icon files bundled
- **Timer app**: ~800+ icon files bundled  
- **Cards app**: ~800+ icon files bundled

### After Tree-Shaking
- **Radio app**: ~18 icons (98% reduction)
- **Timer app**: ~13 icons (98% reduction)
- **Cards app**: ~12 icons (98% reduction)

## Benefits

✅ **Massive bundle size reduction** (90%+ fewer icon files)  
✅ **Faster build times** (fewer files to process)  
✅ **Better performance** (smaller app downloads)  
✅ **Improved tree-shaking** (only bundle what's used)  
✅ **Development insights** (see exactly which icons you use)  
✅ **Backwards compatible** (falls back for dynamic icons)  

## Advanced Configuration

### Custom Icon Patterns

For complex icon usage patterns, customize the analysis:

```javascript
// Custom regex patterns for icon detection
const customPatterns = [
  /iconName:\s*['"]([^'"]+)['"]/g,
  /computedIcon\(\s*['"]([^'"]+)['"]\s*\)/g
]
```

### Per-App Optimization

Each app gets its own optimized loader:

```
apps/radio/src/utils/icons.js     → 18 icons
apps/timer/src/utils/icons.js     → 13 icons  
apps/cards/src/utils/icons.js     → 12 icons
```

### Dynamic Icon Handling

The optimized loader gracefully handles dynamic icons:

```javascript
// Known icon (optimized)
await getIcon('heart-fat') // ✅ Fast, from optimized set

// Dynamic icon (fallback)
await getIcon(computedIconName) // ⚠️ Warning + fallback to full library
```

## open-icon Package Improvements

Since you own the `open-icon` package, consider these improvements:

### 1. Individual Icon Exports

```javascript
// Enable tree-shaking at the package level
export { default as HeartFat } from './icons/heart-fat.js'
export { default as CheckM } from './icons/check-m.js'
// ... individual exports for each icon
```

### 2. Build-Time Icon Analysis

```javascript
// Package-level build analysis
npm run analyze-usage --consumers=./path/to/apps
```

### 3. ESM-First Distribution

```json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./icons/*": "./dist/icons/*.js"
  }
}
```

## Maintenance

### Regular Analysis

Run icon analysis regularly to:

- Track icon usage changes
- Identify unused icons  
- Monitor bundle size impact
- Update optimized loaders

### Automated Workflow

Add to CI/CD pipeline:

```yaml
# .github/workflows/icon-analysis.yml
- name: Analyze Icon Usage
  run: npm run analyze-icons:all
  
- name: Check Bundle Size
  run: npm run build && npm run bundle-size-check
```

This solution provides significant performance improvements while maintaining the flexibility of the `open-icon` package! 🚀
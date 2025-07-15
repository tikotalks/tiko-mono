// Auto-generated optimized icon loader for radio
// Generated on: 2025-07-14T11:19:37.507Z
// Contains 18 icons instead of the full open-icon library

const USED_ICONS = new Set([
  'add-m',
  'check',
  'check-m',
  'clock',
  'edit',
  'edit-m',
  'headphones',
  'moon',
  'multiply-m',
  'music',
  'pause',
  'play',
  'playback-pause',
  'playback-play',
  'plus',
  'volume',
  'volume-2',
  'x'
])

// Cache for loaded icons
const iconCache = new Map()

/**
 * Optimized getIcon function - only allows pre-analyzed icons
 * Falls back to full library for dynamic icons with warning
 */
export async function getIcon(name) {
  // Return cached icon if available
  if (iconCache.has(name)) {
    return iconCache.get(name)
  }
  
  // Load from full library (all icons are bundled anyway by open-icon)
  // But track which ones we're using for optimization insights
  try {
    const { getIcon: originalGetIcon } = await import('open-icon')
    const icon = await originalGetIcon(name)
    
    // Log if we're using an icon not in our optimized set
    if (!USED_ICONS.has(name)) {
      console.info(`📊 Icon "${name}" used dynamically (not in optimized set)`)
    }
    
    iconCache.set(name, icon)
    return icon
  } catch (error) {
    console.error(`Failed to load icon "${name}"`, error)
    return `<svg viewBox="0 0 24 24"><text x="12" y="12" text-anchor="middle" fill="currentColor">${name}</text></svg>`
  }
}

// Re-export types and other utilities
export * from 'open-icon'

// Export optimization metadata
export const ICON_OPTIMIZATION = {
  appName: 'radio',
  optimizedIcons: USED_ICONS,
  totalOptimized: 18,
  generatedAt: '2025-07-14T11:19:37.508Z'
}

// Helper to check if an icon is in the optimized set
export function isOptimizedIcon(name) {
  return USED_ICONS.has(name)
}

// Get list of optimized icons
export function getOptimizedIcons() {
  return Array.from(USED_ICONS)
}

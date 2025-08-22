/**
 * Force update the PWA by clearing all caches and unregistering service workers
 * This is a nuclear option for when the PWA cache is stuck
 */
export async function forceUpdatePWA() {
  console.log('[ForceUpdate] Starting force update process...')
  
  try {
    // 1. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      console.log('[ForceUpdate] Found caches:', cacheNames)
      
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          console.log(`[ForceUpdate] Deleting cache: ${cacheName}`)
          await caches.delete(cacheName)
        })
      )
    }
    
    // 2. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      console.log('[ForceUpdate] Found service worker registrations:', registrations.length)
      
      await Promise.all(
        registrations.map(async (registration) => {
          console.log('[ForceUpdate] Unregistering service worker:', registration.scope)
          await registration.unregister()
        })
      )
    }
    
    // 3. Clear localStorage and sessionStorage (optional, be careful with this)
    // This will clear user data, so only do this if absolutely necessary
    // localStorage.clear()
    // sessionStorage.clear()
    
    // 4. Clear IndexedDB (optional, be very careful with this)
    // This will clear offline data
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(async (db) => {
          if (db.name && db.name.includes('workbox')) {
            console.log(`[ForceUpdate] Deleting IndexedDB: ${db.name}`)
            indexedDB.deleteDatabase(db.name)
          }
        })
      )
    }
    
    console.log('[ForceUpdate] Force update complete. Reloading page...')
    
    // 5. Force reload the page, bypassing cache
    window.location.reload()
    
  } catch (error) {
    console.error('[ForceUpdate] Error during force update:', error)
    // Even if there's an error, try to reload
    window.location.reload()
  }
}

/**
 * Check if an update is available by comparing version
 */
export async function checkForUpdate(): Promise<boolean> {
  try {
    // Fetch the build info with cache bypass
    const response = await fetch('/build-info.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      console.warn('[ForceUpdate] Could not fetch build info')
      return false
    }
    
    const remoteBuildInfo = await response.json()
    
    // Get current build info from the app
    const currentBuildInfo = window.__BUILD_INFO__ || {}
    
    // Compare versions or timestamps
    if (remoteBuildInfo.timestamp !== currentBuildInfo.timestamp) {
      console.log('[ForceUpdate] Update available:', {
        current: currentBuildInfo.timestamp,
        remote: remoteBuildInfo.timestamp
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error('[ForceUpdate] Error checking for update:', error)
    return false
  }
}

// Add to window for easy access in production
if (typeof window !== 'undefined') {
  window.forceUpdatePWA = forceUpdatePWA
  window.checkForUpdate = checkForUpdate
}
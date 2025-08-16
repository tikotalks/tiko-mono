import { onMounted } from 'vue'
import { toastService } from '../components/feedback/TToast/TToast.service'

export interface PWAUpdateOptions {
  autoUpdate?: boolean
  showPrompt?: boolean
}

export function usePWAUpdate(options: PWAUpdateOptions = {}) {
  const { autoUpdate = false, showPrompt = true } = options
  
  let updateSW: (() => Promise<void>) | undefined
  
  const checkForUpdates = async () => {
    if (!('serviceWorker' in navigator)) return
    
    try {
      // Import vite-plugin-pwa virtual module
      const { registerSW } = await import('virtual:pwa-register')
      
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (autoUpdate) {
            // Auto update without prompting
            updateServiceWorker()
          } else if (showPrompt) {
            // Show persistent toast for manual update
            toastService.show({
              id: 'pwa-update',
              type: 'info',
              title: 'Update Available',
              message: 'A new version is available. Click to update.',
              duration: 0, // No auto-dismiss
              dismissible: true,
              position: 'bottom',
              onClose: () => {
                // When user clicks the toast, update the app
                updateServiceWorker()
              }
            })
          }
        },
        onOfflineReady() {
          console.log('App ready to work offline')
        },
        onRegisteredSW(swUrl, registration) {
          console.log('Service worker registered:', swUrl)
          
          // Also listen for update events from the service worker
          if (registration) {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker installed
                    if (!autoUpdate && showPrompt) {
                      toastService.show({
                        id: 'pwa-update',
                        type: 'info',
                        title: 'Update Available',
                        message: 'A new version is available. Click to update.',
                        duration: 0, // No auto-dismiss
                        dismissible: true,
                        position: 'bottom',
                        onClose: () => {
                          updateServiceWorker()
                        }
                      })
                    }
                  }
                })
              }
            })
          }
        }
      })
    } catch (error) {
      console.error('Failed to register service worker:', error)
    }
  }
  
  const updateServiceWorker = async () => {
    if (updateSW) {
      // Hide any existing update toasts
      toastService.hide('pwa-update')
      
      // Show updating toast
      toastService.show({
        type: 'info',
        message: 'Updating app...',
        duration: 2000
      })
      
      // Perform the update
      await updateSW()
      
      // Reload the page to use the new service worker
      window.location.reload()
    }
  }
  
  // Check for updates on mount
  onMounted(() => {
    checkForUpdates()
  })
  
  return {
    checkForUpdates,
    updateServiceWorker
  }
}
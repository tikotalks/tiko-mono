import { toastService } from '../components/feedback/TToast/TToast.service'
import { checkForUpdate } from '../utils/force-update'

export interface RegisterSWOptions {
  immediate?: boolean
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
  onRegisteredSW?: (swUrl: string, registration: ServiceWorkerRegistration | undefined) => void
  onRegisterError?: (error: any) => void
}

export type RegisterSWFunc = (options?: RegisterSWOptions) => (reloadPage?: boolean) => Promise<void>

export interface PWAUpdateOptions {
  autoUpdate?: boolean
  showPrompt?: boolean
  registerSW: RegisterSWFunc
}

export function usePWAUpdate(options: PWAUpdateOptions) {
  const { autoUpdate = false, showPrompt = true, registerSW } = options
  
  let updateSW: (() => Promise<void>) | undefined
  
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
  
  const initializePWA = () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers not supported')
      return
    }
    
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
  }
  
  // Initialize immediately
  initializePWA()
  
  // Also check for updates periodically (every 30 seconds in production)
  if (process.env.NODE_ENV === 'production') {
    // Initial check after 5 seconds
    setTimeout(async () => {
      const hasUpdate = await checkForUpdate()
      if (hasUpdate && showPrompt) {
        toastService.show({
          id: 'pwa-version-update',
          type: 'warning',
          title: 'New Version Available',
          message: 'A new version is available. Please refresh to update.',
          duration: 0,
          dismissible: true,
          position: 'top',
          action: {
            label: 'Refresh Now',
            handler: () => {
              window.location.reload()
            }
          }
        })
      }
    }, 5000)
    
    // Then check every 30 seconds
    setInterval(async () => {
      const hasUpdate = await checkForUpdate()
      if (hasUpdate) {
        // If update is available, refresh automatically after showing notification
        toastService.show({
          type: 'info',
          message: 'Updating to the latest version...',
          duration: 2000
        })
        
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }, 30000)
  }
  
  return {
    updateServiceWorker
  }
}
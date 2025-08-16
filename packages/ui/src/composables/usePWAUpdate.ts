import { toastService } from '../components/feedback/TToast/TToast.service'

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
  
  return {
    updateServiceWorker
  }
}
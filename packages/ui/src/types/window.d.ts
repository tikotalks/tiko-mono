declare global {
  interface Window {
    __BUILD_INFO__?: {
      version?: string
      timestamp?: string
      commit?: string
      environment?: string
    }
    forceUpdatePWA?: () => Promise<void>
    checkForUpdate?: () => Promise<boolean>
  }
}

export {}
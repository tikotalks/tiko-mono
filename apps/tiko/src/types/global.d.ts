declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean
      Plugins?: {
        App?: {
          openUrl: (options: { url: string }) => Promise<void>
          addListener: (event: string, callback: (data: any) => void) => void
        }
      }
    }
  }
}

export {}
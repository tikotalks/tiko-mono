import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  workbox: {
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 // 3 MB
  },
  manifest: {
    name: 'Media - Tiko',
    short_name: 'Media',
    description: 'Tiko Media library app',
    theme_color: '#667eea',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
}

// Disable PWA for development to avoid caching issues
export default createViteConfig({
  dirname: __dirname,
  port: 5000,
  pwaConfig: process.env.NODE_ENV === 'production' ? pwaConfig : null,
  appName: 'media',
  appId: 'media',
  i18nConfig: {
    // Media uses shared @tiko/ui translations, no app-specific translations
    appSpecific: false
  }
})

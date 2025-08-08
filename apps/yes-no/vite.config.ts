import { createViteConfig } from '../../vite.config.base'

const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  workbox: {
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 // 3MB
  },
  manifest: {
    name: 'Yes-No - Tiko',
    short_name: 'Yes-No',
    description: 'Simple question-answer app',
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

const i18nConfig = {
  excludeSections: ['admin', 'deployment', 'media', 'content']
}

export default createViteConfig(__dirname, 3000, pwaConfig, 'yes-no', i18nConfig)
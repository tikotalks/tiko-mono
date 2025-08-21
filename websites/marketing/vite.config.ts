import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))


const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icons/*.png'],
  manifest: {
    name: 'Tiko',
    short_name: 'Tiko',
    description: 'Marketing Website for Tiko',
    theme_color: '#9333ea',
    background_color: '#9333ea',
    display: "standalone" as "standalone",
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: 'icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'icons/android-chrome-512x512.png',
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
  appName: 'marketing',
  appId: 'marketing',
  i18nConfig: {}
})

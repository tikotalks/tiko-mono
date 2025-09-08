import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icons/*.png'],
  manifest: {
    name: 'Cards - Tiko',
    short_name: 'Cards',
    description: 'Cards App',
    theme_color: '#4fcf4f',
    background_color: '#ffffff',
    display: 'standalone' as 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'icons/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'icons/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
}

const i18nConfig = {
  excludeSections: ['admin', 'deployment', 'media', 'content'],
}

export default createViteConfig({
  dirname: __dirname,
  port: 3003,
  pwaConfig,
  appName: 'cards',
  appId: 'cards',
  i18nConfig,
  base: '/',
})

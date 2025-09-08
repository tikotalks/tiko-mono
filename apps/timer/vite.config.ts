import { createViteConfig } from '../../vite.config.base'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Timer - Tiko',
    short_name: 'Timer',
    description: 'Simple visual timer app for children',
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
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
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
  port: 3001,
  pwaConfig,
  appName: 'timer',
  appId: 'timer',
  i18nConfig,
})

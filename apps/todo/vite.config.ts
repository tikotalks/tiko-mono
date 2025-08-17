import { createViteConfig } from '../../vite.config.base'

const pwaConfig = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Todo - Tiko',
    short_name: 'Todo',
    description: 'Visual todo list app with groups and items',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    display: 'standalone' as 'standalone',
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

export default createViteConfig({
  dirname: __dirname,
  port: 3007,
  pwaConfig,
  appName: 'todo',
  i18nConfig: {}
})

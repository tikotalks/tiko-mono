import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export const createViteConfig = (appDir: string, defaultPort: number, pwaConfig?: any) => {
  // Get port from environment variable or use default
  const port = process.env['PORT'] ? parseInt(process.env['PORT']) : defaultPort
  
  const plugins = [vue()]
  
  if (pwaConfig) {
    plugins.push(VitePWA(pwaConfig) as any)
  }
  
  return defineConfig({
    plugins,
    resolve: {
      alias: {
        '@': resolve(appDir, './src'),
        '@tiko/ui': resolve(appDir, '../../packages/ui/src'),
        '@tiko/core': resolve(appDir, '../../packages/core/src')
      }
    },
    envDir: resolve(appDir, '../../'),
    server: {
      port
    },
    build: {
      outDir: 'dist'
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `\n@use "@tiko/ui/styles/global.scss" as global;`,
        },
      },
    },
  })
}
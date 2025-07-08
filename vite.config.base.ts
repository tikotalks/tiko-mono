import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export const createViteConfig = (appDir: string, defaultPort: number) => {
  // Get port from environment variable or use default
  const port = process.env.PORT ? parseInt(process.env.PORT) : defaultPort
  
  return defineConfig({
    plugins: [vue()],
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
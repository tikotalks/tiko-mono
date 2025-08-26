import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from the package root, not from ./dev
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    root: './dev',
    base: '/',
    envDir: '..',  // Look for .env files in parent directory
    server: {
      port: 5174,
      open: true,
      fs: {
        allow: ['..']
      }
    },
    resolve: {
      alias: {
        '@tiko/core': resolve(__dirname, '../core/src'),
        '@tiko/animations': resolve(__dirname, './src'),
        '@': resolve(__dirname, './src')
      }
    },
    optimizeDeps: {
      include: ['vue'],
      exclude: ['@tiko/core']
    },
    build: {
      rollupOptions: {
        external: ['@tiko/core']
      }
    }
  }
})
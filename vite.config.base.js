import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export function createViteConfig(dirname, port = 3000, pwaConfig = null) {
  const plugins = [vue()]
  
  if (pwaConfig) {
    plugins.push(VitePWA(pwaConfig))
  }

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
        '@tiko/ui': path.resolve(dirname, '../../packages/ui/src'),
        '@tiko/core': path.resolve(dirname, '../../packages/core/src')
      }
    },
    server: {
      port,
      strictPort: false,
      open: false,
      cors: true,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'tiko-vendor': ['@tiko/ui', '@tiko/core']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', '@tiko/ui', '@tiko/core']
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  })
}
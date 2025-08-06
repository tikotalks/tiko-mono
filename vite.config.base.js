import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'
import { viteBuildInfo } from './scripts/vite-plugin-build-info.js'
import { createAppI18nPlugin } from './scripts/vite-plugin-i18n-simple.js'
import { i18nWorkerPlugin } from './scripts/vite-plugin-i18n-worker.js'

export function createViteConfig(dirname, port = 3000, pwaConfig = null, appName = null, i18nConfig = null) {
  let buildInfo = null;
  
  // Inject build info before build
  if (process.env.NODE_ENV === 'production') {
    try {
      execSync(`node ${path.resolve(__dirname, 'scripts/inject-build-info.js')} ${dirname}`, {
        stdio: 'inherit'
      })
      
      // Read the generated build info for the plugin
      const buildInfoPath = path.join(dirname, 'public', 'build-info.json');
      if (fs.existsSync(buildInfoPath)) {
        buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to inject build info:', error.message)
    }
  }
  
  const plugins = [vue()]
  
  // Add i18n generation plugin ONLY for production/CI builds
  // In development, use manually generated translations via pnpm i18n
  if (appName && (process.env.NODE_ENV === 'production' || process.env.CI === 'true')) {
    const i18nOptions = {
      app: appName,
      environment: 'production',
      ...(i18nConfig || {})
    }
    
    // Always use worker-based plugin for production/CI
    plugins.push(i18nWorkerPlugin(i18nOptions))
  }
  
  // Add build info plugin if we have build information
  if (buildInfo) {
    plugins.push(viteBuildInfo(buildInfo))
  }
  
  if (pwaConfig) {
    plugins.push(VitePWA(pwaConfig))
  }

  return defineConfig({
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
        '@tiko/ui': path.resolve(dirname, '../../packages/ui/src'),
        '@tiko/core': path.resolve(dirname, '../../packages/core/src'),
        'bemm': path.resolve(dirname, '../../node_modules/bemm/dist/index.mjs')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api']
        }
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
      include: ['vue', 'vue-router', 'pinia', '@tiko/ui', '@tiko/core', 'open-icon', 'bemm']
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  })
}
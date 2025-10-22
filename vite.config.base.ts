import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { execSync } from 'child_process'
import fs from 'fs'
import { viteBuildInfo } from './scripts/vite-plugin-build-info.js'
import { createAppI18nPlugin } from './scripts/vite-plugin-i18n-simple.js'
import { i18nWorkerPlugin } from './scripts/vite-plugin-i18n-worker.js'
import { copyFontsPlugin } from './scripts/vite-plugin-copy-fonts.js'
import CircularDependencyPlugin from 'vite-plugin-circular-dependency'
import { fileURLToPath } from 'url'
import { dirname as pathDirname } from 'path'

const __dirname = pathDirname(fileURLToPath(import.meta.url))

export const createViteConfig = (args: {
  dirname: string,
  port: number,
  pwaConfig: null | {
    registerType: string,
    includeAssets: string[],
    manifest: {
      name: string,
      short_name: string,
      description: string,
      theme_color: string,
      background_color: string,
      display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser',
      orientation?: string,
      scope?: string,
      start_url: string,
      icons?: {
        src: string,
        sizes: string,
        type: string
      }[]
    },
  },
  appName: string,
  appId: string,
  i18nConfig: {
    excludeSections?: string[],
  },
  base?: string
}) => {

  const { dirname, port, pwaConfig, appName, i18nConfig, base } = args


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

  const plugins = [
    vue(),
    CircularDependencyPlugin({
      circleImportThrowErr: false,
      circleImportReplace: true,
      exclude: /node_modules/
    }),
    copyFontsPlugin()
  ]

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
    // Generate a unique version based on timestamp
    const buildVersion = new Date().toISOString()
    
    // Enhance PWA config with better caching and update strategies
    const enhancedPwaConfig = {
      ...pwaConfig,
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/__/], // Don't cache vite dev server routes
        ...pwaConfig.workbox,
        // Add version to cache names to force updates
        cacheId: `${appName}-v${buildVersion}`,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            urlPattern: /^https:\/\/tts-generation\..*\.workers\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tts-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          ...(pwaConfig.workbox?.runtimeCaching || [])
        ]
      }
    }
    plugins.push(VitePWA(enhancedPwaConfig))
  }

  // Only set envDir for local development, not CI
  const config = {
    plugins,
    base: base || '/',
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
        '@tiko/ui': path.resolve(dirname, '../../packages/ui/src'),
        '@tiko/core': path.resolve(dirname, '../../packages/core/src'),
        '@tiko/upos': path.resolve(dirname, '../../packages/upos/src'),
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
          },
          // Add content hash to filenames for cache busting
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', '@tiko/ui', '@tiko/core', 'open-icon', 'bemm'],
      exclude: ['@tiko/upos']
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  }

  // Only set envDir for local development, not CI
  if (!process.env.CI && !process.env.GITHUB_ACTIONS) {
    config.envDir = path.resolve(dirname, '../..')
  }

  return defineConfig(config)
}

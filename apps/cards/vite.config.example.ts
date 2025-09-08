/**
 * Example Vite configuration for apps using static i18n generation
 *
 * This shows how to integrate the i18n generation plugin into your app's build process.
 * Copy this pattern to your app's vite.config.ts file.
 *
 * The plugin will:
 * 1. Generate TypeScript translation files from database
 * 2. Filter translations based on app needs (exclude admin/deployment keys)
 * 3. Provide type safety and auto-completion
 * 4. Eliminate runtime database dependencies
 */

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteBuildInfo } from '../../scripts/vite-plugin-build-info.js'
import { createAppI18nPlugin } from '../../scripts/vite-plugin-i18n-generation'

const buildInfo = getBuildInfo(import.meta.dirname)

export default defineConfig({
  plugins: [
    vue(),
    viteBuildInfo(buildInfo),

    // Add i18n generation plugin
    createAppI18nPlugin('yes-no'),

    // Or with custom options:
    // i18nGeneration({
    //   app: 'yes-no',
    //   languages: ['en', 'nl', 'fr'], // specific languages only
    //   verbose: true,
    //   watch: true // regenerate on changes during dev
    // })
  ],

  // ... rest of your config
})

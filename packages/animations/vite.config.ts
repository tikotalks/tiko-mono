import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TikoAnimations',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', '@tiko/core', 'bemm', 'open-icon'],
      output: {
        globals: {
          vue: 'Vue',
          '@tiko/core': 'TikoCore',
          'bemm': 'bemm',
          'open-icon': 'OpenIcon'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css'
          return assetInfo.name
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
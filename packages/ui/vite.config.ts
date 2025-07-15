import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: `@use "${resolve(__dirname, 'src/styles/global.scss')}" as global;`
      }
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TikoUI',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'bemm', 'mitt', 'open-icon', '@supabase/supabase-js', '@tiko/core'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          bemm: 'bemm',
          mitt: 'mitt',
          'open-icon': 'OpenIcon',
          '@supabase/supabase-js': 'Supabase',
          '@tiko/core': 'TikoCore'
        }
      }
    }
  }
})
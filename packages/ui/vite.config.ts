import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
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
      external: ['vue', 'pinia', 'bemm', 'mitt', 'open-icon', '@supabase/supabase-js', '@tiko/core', '@tiptap/vue-3', '@tiptap/starter-kit', '@tiptap/extension-placeholder', '@tiptap/extension-link', '@tiptap/extension-underline'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          bemm: 'bemm',
          mitt: 'mitt',
          'open-icon': 'OpenIcon',
          '@supabase/supabase-js': 'Supabase',
          '@tiko/core': 'TikoCore',
          '@tiptap/vue-3': 'TipTapVue3',
          '@tiptap/starter-kit': 'TipTapStarterKit',
          '@tiptap/extension-placeholder': 'TipTapPlaceholder',
          '@tiptap/extension-link': 'TipTapLink',
          '@tiptap/extension-underline': 'TipTapUnderline'
        }
      }
    }
  }
})
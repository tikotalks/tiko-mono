import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tiko/ui': resolve(__dirname, '../../packages/ui/src'),
      '@tiko/core': resolve(__dirname, '../../packages/core/src')
    }
  },
  envDir: resolve(__dirname, '../../'),
  server: {
    port: 3002,
    host: true
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
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
  server: {
    port: 3002,
    host: true
  }
})
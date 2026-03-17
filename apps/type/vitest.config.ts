import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      { find: /^@tiko\/ui$/, replacement: resolve(__dirname, '../../packages/ui/src') },
      {
        find: /^@tiko\/ui\/(.*)$/,
        replacement: `${resolve(__dirname, '../../packages/ui/src')}/$1`,
      },
      { find: /^@tiko\/core$/, replacement: resolve(__dirname, '../../packages/core/src') },
      {
        find: /^@tiko\/core\/(.*)$/,
        replacement: `${resolve(__dirname, '../../packages/core/src')}/$1`,
      },
      { find: /^@tiko\/upos$/, replacement: resolve(__dirname, '../../packages/upos/src') },
      {
        find: /^@tiko\/upos\/(.*)$/,
        replacement: `${resolve(__dirname, '../../packages/upos/src')}/$1`,
      },
      { find: 'bemm', replacement: resolve(__dirname, '../../node_modules/bemm/dist/index.mjs') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
  },
})

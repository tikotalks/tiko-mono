import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TikoCore',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'axios', '@tiko/ui'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          axios: 'axios',
          '@tiko/ui': 'TikoUI'
        }
      }
    }
  }
})
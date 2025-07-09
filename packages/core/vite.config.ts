import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TikoCore',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'axios'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          axios: 'axios'
        }
      }
    }
  }
})
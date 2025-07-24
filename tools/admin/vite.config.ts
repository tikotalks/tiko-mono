import { createViteConfig } from '../../vite.config.base'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env files from both root and admin directory
  const rootDir = path.resolve(__dirname, '../..')
  const rootEnv = loadEnv(mode, rootDir, '')
  const localEnv = loadEnv(mode, __dirname, '')
  const env = { ...rootEnv, ...localEnv } // Local overrides root
  
  const baseConfig = createViteConfig(__dirname, 5200)
  
  return {
    ...baseConfig,
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use '@tiko/ui/styles/global.scss' as global;`
        }
      }
    },
    define: {
      ...baseConfig.define,
      'import.meta.env.VITE_R2_ACCESS_KEY_ID': JSON.stringify(env.R2_ACCESS_KEY_ID || ''),
      'import.meta.env.VITE_R2_SECRET_ACCESS_KEY': JSON.stringify(env.R2_SECRET_ACCESS_KEY || ''),
      'import.meta.env.VITE_R2_ENDPOINT': JSON.stringify(env.R2_ENDPOINT || ''),
      'import.meta.env.VITE_R2_BUCKET_NAME': JSON.stringify(env.R2_BUCKET_NAME || ''),
      'import.meta.env.VITE_R2_PUBLIC_URL': JSON.stringify(env.R2_PUBLIC_URL || '')
    }
  }
})
import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'media',
  name: 'Media',
  description: 'Media Website for Tiko',
  isApp: false,
  icon: {
    mediaId:'987bc1c3-8f28-4573-8d49-e361016a0f3c',
    color: BaseColors.RED,
  },
  theme: {
    primary: BaseColors.RED,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.PURPLE,
  },
  auth: {
    skipAuth: true
  },
  splash: {
    appName: 'Media',
    color: BaseColors.RED,
    themeColor: ColorValue.RED,
    loadingText: 'Loading Media...'
  }
})

import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'marketing',
  name: 'Tiko',
  description: 'Marketing Website for Tiko',
  icon: {
    mediaId:'987bc1c3-8f28-4573-8d49-e361016a0f3c',
    color: BaseColors.PURPLE,
  },
  theme: {
    primary: BaseColors.PURPLE,
    secondary: BaseColors.BLUE,
    tertiary: BaseColors.ORANGE,
  },
  auth: {
    skipAuth: true
  },
  splash: {
    appName: 'Media',
    backgroundColor: ColorValue.PURPLE,
    themeColor: ColorValue.PURPLE,
    loadingText: 'Loading Tiko...'
  }
})

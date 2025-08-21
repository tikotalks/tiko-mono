import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'marketing',
  name: 'Tiko',
  description: 'Marketing Website for Tiko',
  icon: {
    mediaId:'eb3a81ba-f7e1-417f-bd41-8d69550475f4',
    color: BaseColors.TURQUOISE,
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

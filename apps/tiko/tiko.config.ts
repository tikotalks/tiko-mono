import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'tiko',
  name: 'Tiko',
  icon: {
    mediaId:'c2e7188c-1ac4-41d6-a29c-2b122ec812e8',
    color: BaseColors.GREEN,
  },
  description: 'Tiko App',
  theme: {
    primary: BaseColors.TURQUOISE,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.BLUE,
  },
  auth: {
    skipAuth: true // Allow using the app without login
  },
  splash: {
    show: true,
    appName: 'Tiko',
    color: BaseColors.ORANGE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Tiko...'
  }
})

import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'sequence',
  name: 'Sequence',
  icon: {
    mediaId:'c2e7188c-1ac4-41d6-a29c-2b122ec812e8',
    color: BaseColors.GREEN,
  },
  description: 'Sequence App',
  theme: {
    primary: BaseColors.TEAL,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.BLUE,
  },
  auth: {
    skipAuth: true, // Allow using the app without login
    showLoginButton: true // Show login button in skip auth mode
  },
  topBar: {
    show: true,
  },
  splash: {
    show: true,
    appName: 'Sequence',
    color: BaseColors.ORANGE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Sequence...'
  }
})

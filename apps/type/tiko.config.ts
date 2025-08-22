import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'type',
  name: 'Type',
  description: 'Typing practice app',
  icon: {
    mediaId: '07eb3cb4-cd71-49c5-8498-ee1e8a3ab7f5',
    color: BaseColors.NAVY,
  },
  auth: {
    skipAuth: true
  },
  theme: {
    primary: BaseColors.PURPLE,
    secondary: BaseColors.GREEN,
    tertiary: BaseColors.RED,
  },
  splash: {
    appName: 'Type',
    color: BaseColors.DARK_BLUE,
    themeColor: ColorValue.PURPLE,
    loadingText: 'Loading Type...'
  },
  i18n: {
    categories: ['common', 'type']
  }
})

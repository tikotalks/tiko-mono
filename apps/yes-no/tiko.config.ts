import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'yes-no',
  name: 'Yes-No',
  icon: {
    mediaId: '07eb3cb4-cd71-49c5-8498-ee1e8a3ab7f5',
    color: BaseColors.NAVY,
  },
  description: 'Simple yes/no decision maker app',
  theme: {
    primary: BaseColors.PURPLE,
    secondary: BaseColors.GREEN,
    tertiary: BaseColors.RED,
  },
  auth: {
    skipAuth: true
  },
  splash: {
    show: true,
    appName: 'Yes-No',
    color: ColorValue.BLUE_DARK,
    themeColor: ColorValue.PURPLE,
    loadingText: 'Loading Yes-No...'
  },
  i18n: {
    categories: ['common', 'yesno']
  }
})

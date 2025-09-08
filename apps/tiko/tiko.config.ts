import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'yes-no',
  name: 'Yes-No',
  icon: {
    mediaId: 'c2e7188c-1ac4-41d6-a29c-2b122ec812e8',
    color: BaseColors.PURPLE,
  },
  description: 'Simple yes/no decision maker app',
  theme: {
    primary: BaseColors.PURPLE,
    secondary: BaseColors.GREEN,
    tertiary: BaseColors.RED,
  },
  auth: {
    skipAuth: true,
  },
  splash: {
    show: true,
    appName: 'Tiko',
    color: ColorValue.BLUE_DARK,
    themeColor: ColorValue.PURPLE,
    loadingText: 'Loading Tiko...',
  },
  i18n: {
    categories: ['common', 'tiko'],
  },
})

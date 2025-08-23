import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'ui-docs',
  name: 'UI Documentation',
  description: 'Complete documentation and testing suite for all Tiko UI components',
  icon: {
    mediaId: '07eb3cb4-cd71-49c5-8498-ee1e8a3ab7f5',
    color: BaseColors.NAVY,
  },
  splash: {
    show: true,
    appName: 'UI Documentation',
    color: BaseColors.BLUE_DARK,
    themeColor: ColorValue.PURPLE,
    loadingText: 'Loading UI Documentation...'
  }
})

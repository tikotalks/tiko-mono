import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'type',
  name: 'Type',
  description: 'Typing practice app',
  icon: {
    mediaId: 'eecf2917-a885-4025-a762-9c7a8783f5af',
    color: BaseColors.ORANGE,
  },
  auth: {
    skipAuth: true,
  },
  theme: {
    primary: BaseColors.ORANGE,
    secondary: BaseColors.SKYBLUE,
    tertiary: BaseColors.PURPLE,
  },
  splash: {
    show: true,
    appName: 'Type',
    color: BaseColors.ORANGE,
    themeColor: ColorValue.ORANGE,
    loadingText: 'Loading Type...',
  },
  i18n: {
    categories: ['common', 'type'],
  },
})

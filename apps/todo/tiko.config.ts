import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'todo',
  name: 'To Do',
  description: 'To Do',
  icon: {
    mediaId: 'eecf2917-a885-4025-a762-9c7a8783f5af',
    color: BaseColors.ORANGE,
  },
  auth: {
    skipAuth: true
  },
  theme: {
    primary: BaseColors.ORANGE,
    secondary: BaseColors.BLUE,
    tertiary: BaseColors.PURPLE,
  },
  splash: {
    show: true,
    appName: 'To Do',
    color: BaseColors.ORANGE,
    themeColor: ColorValue.ORANGE,
    loadingText: 'Loading To DO...'
  },
  i18n: {
    categories: ['common', 'todo']
  }
})

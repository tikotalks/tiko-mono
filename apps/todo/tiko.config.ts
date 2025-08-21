import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'todo',
  name: 'To Do',
  description: 'To Do App',
  icon: {
    mediaId:'13a53fe8-b34d-46bc-befe-20b5fed3694c',
    color: BaseColors.SAND,
  },
  theme: {
    primary: BaseColors.BLUE,
    secondary: BaseColors.TURQUOISE,
    tertiary: BaseColors.GOLD,
  },
  auth: {
    skipAuth: true
  },
  splash: {
    appName: 'To Do',
    backgroundColor: ColorValue.SAND,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading To do\'s...'
  }
})




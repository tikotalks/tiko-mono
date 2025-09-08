import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'timer',
  name: 'Timer',
  icon: {
    mediaId: 'e0fd103e-8879-4a2f-bbce-8ed1210bd265',
    color: BaseColors.ORANGE,
  },
  description: 'Timer app with countdown and stopwatch features',
  theme: {
    primary: BaseColors.ORANGE,
    secondary: BaseColors.BLUE,
    tertiary: BaseColors.GREEN,
  },
  auth: {
    skipAuth: true,
  },
  splash: {
    show: true,
    appName: 'Timer',
    color: BaseColors.ORANGE,
    themeColor: ColorValue.ORANGE,
    loadingText: 'Loading Timer...',
  },
})

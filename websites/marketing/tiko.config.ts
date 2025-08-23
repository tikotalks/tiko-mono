import { defineConfig } from '@tiko/core'
import { BaseColors, ColorValue } from '@tiko/ui'

export default defineConfig({
  id: 'marketing',
  name: 'Marketing',
  description: 'Marketing App',
  isApp: false,
  icon: {
    mediaId:'e37943b4-582c-40ee-be3a-c47be7c6e658',
    color: BaseColors.GREEN,
  },
  topBar: {
    show: false
  },
  theme: {
    primary: BaseColors.GREEN,
    secondary: BaseColors.ORANGE,
    tertiary: BaseColors.PURPLE,
  },
  auth: {
    show: false,
    skipAuth: true
  },
  splash: {
    show: false,
    appName: 'Tiko',
    color: BaseColors.BLUE,
    themeColor: ColorValue.BLACK,
    loadingText: 'Loading Tiko...'
  }
})
